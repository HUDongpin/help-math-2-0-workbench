import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getZogXIntroState, ZogXTeachingCopy, zogXIntroAt} from './g4-l4-zog-x-intro';
import {G4_L4_ZOG_X_INTRO as source} from './generated/g4-l4-zog-x-intro-config';

test('the source mask, not placement time, determines instruction disclosure', () => {
  const text = (frame: number, cid: number) => getZogXIntroState(frame).body.find(row => row.characterId === cid)!;
  assert.equal(text(199, 83).visibleText, '');
  assert.equal(text(200, 83).visibleText, 'Addition ');
  assert(text(281, 94).instance);
  assert.equal(text(281, 94).visibleText, '');
  assert.equal(text(369, 94).instance, undefined);
  assert.equal(text(372, 94).visibleText, '');
  assert.equal(text(373, 94).visibleText, 'Each ');
  assert.equal(text(526, 129).visibleText, 'started, click Repeat Directions.');
  assert(getZogXIntroState(592).body.every(row => row.visibleText === '' && !row.instance));
});

test('demonstration stays separate from the interactive question and blank number field', () => {
  assert.equal(getZogXIntroState(297).demonstrationVisible, false);
  assert.equal(getZogXIntroState(298).demonstrationVisible, true);
  assert.equal(getZogXIntroState(362).demonstrationVisible, true);
  assert.equal(getZogXIntroState(363).demonstrationVisible, false);
  assert.equal(source.demonstration.numberFieldText, '');
  assert.equal(source.demonstration.prompt.text, '3,661 + 829 = ?');
  assert.deepEqual(source.demonstration.answers.map(a => [a.letter.text, a.value.text]),
    [['A', '3,480'], ['B', '3,490'], ['C', '4,480'], ['D', '4,490']]);
  assert.equal(zogXIntroAt<number>(source.demonstration.alpha, 298), 43 / 256);
  assert.equal(zogXIntroAt<number>(source.demonstration.alpha, 358), 208 / 256);
});

test('pointer preserves all four contacts and disappears on source frame359', () => {
  type Route = {start: string; end: string; progress: number} | null;
  for (const [frame, choice] of [[318, 'A'], [326, 'B'], [338, 'C'], [347, 'D']] as const) {
    assert.deepEqual(zogXIntroAt<Route>(source.demonstration.pointer.route, frame), {start: choice, end: choice, progress: 0});
  }
  const transition = zogXIntroAt<Route>(source.demonstration.pointer.route, 324)!;
  assert.equal(transition.start, 'A');
  assert.equal(transition.end, 'B');
  assert(transition.progress > 0 && transition.progress < 1);
  assert.equal(getZogXIntroState(359).demonstrationPointer, null);
});

test('source emphasis flashes retain duration when reduced motion makes them steady', () => {
  assert.equal(getZogXIntroState(451).startEmphasis, true);
  assert.equal(getZogXIntroState(452).startEmphasis, false);
  assert.equal(getZogXIntroState(452, true).startEmphasis, true);
  assert.equal(getZogXIntroState(458, true).startEmphasis, false);
  assert.equal(getZogXIntroState(516).repeatEmphasis, false);
  assert.equal(getZogXIntroState(516, true).repeatEmphasis, true);
  assert.equal(getZogXIntroState(528, true).repeatEmphasis, false);
});

test('hidden source glossary words are disabled and absent from accessibility exposure', () => {
  const html = renderToStaticMarkup(<ZogXTeachingCopy frame={199} onOpenKeyTerm={() => {}}/>);
  const buttons = [...html.matchAll(/<button[^>]+>/g)].map(match => match[0]);
  assert.equal(buttons.length, 2);
  assert(buttons.every(button => button.includes('disabled=""') && button.includes('aria-hidden="true"') && button.includes('visibility:hidden')));
  const ready = renderToStaticMarkup(<ZogXTeachingCopy frame={591} onOpenKeyTerm={() => {}}/>);
  assert(![...ready.matchAll(/<button[^>]+>/g)].some(match => match[0].includes('disabled=""')));
});

test('seek and replay presentation is pure and rejects a foreign source frame', () => {
  const before = getZogXIntroState(318);
  getZogXIntroState(602); getZogXIntroState(1);
  assert.deepEqual(getZogXIntroState(318), before);
  assert.equal(getZogXIntroState(590).ready, false);
  assert.equal(getZogXIntroState(591).ready, true);
  assert.equal(getZogXIntroState(591).skipEnabled, false);
  for (const frame of [0, 1.5, 603, NaN, Infinity]) assert.throws(() => getZogXIntroState(frame), /outside source domain/);
});
