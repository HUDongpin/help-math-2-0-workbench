import assert from 'node:assert/strict';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import type {LessonTextPresentationBlock, TextPresentationSnapshot} from '../src/lesson-text-contract';
import {
  buildLessonTextLayout,
  LessonFigureTextLayer,
  LessonTextPresentation,
  lessonTextAnchorPercent,
  visibleLessonTextBlocks,
} from '../src/lesson-text-presentation';

const block = (id: string, readingOrder: number, changes: Partial<LessonTextPresentationBlock> = {}): LessonTextPresentationBlock => ({
  id, readingOrder, text: id, role: 'body', language: 'en', visible: true, ...changes,
});
const anchor = {x: 400, y: 150, stageWidth: 800, stageHeight: 600} as const;
const snapshot = (blocks: readonly LessonTextPresentationBlock[], changes: Partial<TextPresentationSnapshot> = {}): TextPresentationSnapshot => ({
  schemaVersion: 1,
  animationId: 'test-only-animation',
  sourceSwfSha256: '0'.repeat(64),
  bindingVersion: 'test-only-v1',
  status: 'ready', blockers: [], blocks, suppressedInstances: [],
  identity: {frame: 1, frameDomain: 'root', rootFrame: 1, scenario: 'test', language: 'en', seed: 3, replay: 0},
  ...changes,
});

test('state-driven rendering omits unrevealed answers instead of merely hiding them', () => {
  const waiting = snapshot([
    block('question', 1, {role: 'question', text: 'What is −3 + 5?'}),
    block('answer', 3, {role: 'answer', text: 'The answer is 2.', visible: false}),
    block('feedback', 4, {role: 'feedback', text: 'Correct.', visible: false}),
  ]);
  const html = renderToStaticMarkup(createElement(LessonTextPresentation, {snapshot: waiting, template: 'exercise'}));
  assert.match(html, /What is −3 \+ 5\?/);
  assert.doesNotMatch(html, /The answer is 2|Correct\.|test-only-animation|test-only-v1|00000000/);
  assert.doesNotMatch(html, /data-lesson-text-block="(?:answer|feedback)"/);

  const answered = snapshot(waiting.blocks.map((entry) => ({...entry, visible: true})));
  const answeredHtml = renderToStaticMarkup(createElement(LessonTextPresentation, {snapshot: answered, template: 'exercise'}));
  assert.match(answeredHtml, /The answer is 2\./);
  assert.match(answeredHtml, /Correct\./);
  assert.equal(waiting.blocks[1].visible, false, 'rendering must not mutate teaching state');
});

test('a blocked snapshot exposes neither modern text nor private diagnostics', () => {
  const blocked = snapshot([block('answer', 1, {text: 'Hidden answer'})], {status: 'blocked', blockers: ['private-source-path']});
  assert.equal(renderToStaticMarkup(createElement(LessonTextPresentation, {
    snapshot: blocked, template: 'explanation', figure: createElement('canvas'),
  })), '');
  assert.equal(renderToStaticMarkup(createElement(LessonFigureTextLayer, {snapshot: blocked})), '');
});

test('layout preserves source reading order without mutating the incoming block list', () => {
  const blocks = Object.freeze([
    block('feedback', 5, {role: 'feedback'}),
    block('right-label', 3, {role: 'label', anchor}),
    block('question', 1, {role: 'question'}),
    block('left-label', 2, {role: 'label', anchor: {...anchor, x: 0}}),
  ]);
  const items = buildLessonTextLayout({snapshot: snapshot(blocks), hasFigure: true, hasControls: true, controlsReadingOrder: 4});
  assert.deepEqual(items.map((item) => item.key), ['block:question', 'figure', 'controls', 'block:feedback']);
  const figure = items.find((item) => item.kind === 'figure');
  assert.equal(figure?.kind, 'figure');
  if (figure?.kind === 'figure') assert.deepEqual(figure.labels.map((label) => label.id), ['left-label', 'right-label']);
  assert.deepEqual(blocks.map((entry) => entry.id), ['feedback', 'right-label', 'question', 'left-label']);
});

test('interleaved prose and labels require a dedicated renderer rather than silent reordering', () => {
  const state = snapshot([
    block('a', 1, {role: 'label', anchor}),
    block('prose', 2),
    block('b', 3, {role: 'label', anchor}),
  ]);
  assert.throws(() => buildLessonTextLayout({snapshot: state, hasFigure: true}), /consecutive reading group/);
  const labelOnly = snapshot(state.blocks.filter((entry) => entry.anchor));
  assert.throws(() => buildLessonTextLayout({snapshot: labelOnly, hasFigure: true, hasControls: true, controlsReadingOrder: 2}), /cannot interrupt/);
});

test('equal reading-order values retain the incoming stable order when labels are grouped', () => {
  const state = snapshot([
    block('label', 2, {role: 'label', anchor}),
    block('following-prose', 2),
  ]);
  assert.deepEqual(buildLessonTextLayout({snapshot: state, hasFigure: true}).map((item) => item.key), ['figure', 'block:following-prose']);
});

test('invalid bindings fail explicitly instead of omitting teaching content', () => {
  assert.throws(() => visibleLessonTextBlocks(snapshot([block('same', 1), block('same', 2)])), /unique stable instance IDs/);
  assert.throws(() => visibleLessonTextBlocks(snapshot([block('bad-order', Number.NaN)])), /reading order/);
  assert.throws(() => visibleLessonTextBlocks(snapshot([block('anchored-prose', 1, {anchor})])), /Only figure labels/);
  assert.throws(() => buildLessonTextLayout({snapshot: snapshot([block('label', 1, {role: 'label', anchor})]), hasFigure: false}), /matching figure/);
  assert.throws(() => buildLessonTextLayout({snapshot: snapshot([]), hasFigure: true}), /explicit reading order/);
  assert.throws(() => buildLessonTextLayout({snapshot: snapshot([]), hasFigure: true, figureReadingOrder: Infinity}), /must be finite/);
});

test('anchors retain authored coordinates while using a percentage viewport', () => {
  assert.deepEqual(lessonTextAnchorPercent(anchor), {x: '50%', y: '25%', textAnchor: 'middle'});
  const offStage = lessonTextAnchorPercent({...anchor, x: -80, y: 660, align: 'end'});
  assert.equal(offStage.x, '-10%');
  assert.ok(Math.abs(Number.parseFloat(offStage.y) - 110) < 1e-10);
  assert.equal(offStage.textAnchor, 'end');
  assert.equal(lessonTextAnchorPercent({...anchor, align: 'start'}).textAnchor, 'start');
  for (const invalid of [{stageWidth: 0}, {stageHeight: -1}, {x: Infinity}, {y: Number.NaN}]) {
    assert.throws(() => lessonTextAnchorPercent({...anchor, ...invalid}), /finite coordinates and positive stage/);
  }
});

test('figure labels remain actual selectable SVG text without a scaling viewBox or flattened image semantics', () => {
  const html = renderToStaticMarkup(createElement(LessonFigureTextLayer, {
    snapshot: snapshot([block('negative', 1, {text: '−2.5', role: 'label', anchor, language: 'es'})]),
  }));
  assert.match(html, /<text[^>]+x="50%"[^>]+y="25%"[^>]*>−2\.5<\/text>/);
  assert.match(html, /lang="es"/);
  assert.doesNotMatch(html, /viewBox|role="img"|<path|<image|font-size=/);
});

test('all templates emit semantic headings and preserve exact text without evaluating markup', () => {
  const state = snapshot([
    block('title', 1, {role: 'title', text: 'Números y signos'}),
    block('step', 2, {role: 'heading', text: 'Compare'}),
    block('body', 3, {text: '−4 < 2\nNever <script>run()</script>.'}),
  ]);
  for (const template of ['explanation', 'exercise', 'complex-figure'] as const) {
    const html = renderToStaticMarkup(createElement(LessonTextPresentation, {snapshot: state, template}));
    assert.match(html, new RegExp(`lesson-text-presentation--${template}`));
    assert.match(html, /<h2[^>]*>Números y signos<\/h2>/);
    assert.match(html, /<h3[^>]*>Compare<\/h3>/);
    assert.match(html, /−4 &lt; 2\nNever &lt;script&gt;run\(\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>/);
  }
});

test('complex figures provide an ordered readable label list and keyboard-accessible local viewport', () => {
  const state = snapshot([
    block('a', 2, {text: '−10', role: 'label', anchor}),
    block('b', 3, {text: '+10', role: 'label', anchor: {...anchor, x: 600}}),
  ]);
  const html = renderToStaticMarkup(createElement(LessonTextPresentation, {
    snapshot: state, template: 'complex-figure', figure: createElement('canvas'), figureMinWidthRem: 40,
    figureLabel: 'Number line from −10 to +10',
  }));
  assert.match(html, /tabindex="0"/);
  assert.match(html, /--lesson-figure-min-inline-size:40rem/);
  assert.match(html, /<svg[^>]+aria-hidden="true"/);
  assert.match(html, /<figcaption><ul[^>]*aria-label="Figure labels"><li lang="en">−10<\/li><li lang="en">\+10<\/li>/);
  assert.throws(() => renderToStaticMarkup(createElement(LessonTextPresentation, {
    snapshot: state, template: 'explanation', figure: createElement('canvas'), figureMinWidthRem: 40,
  })), /only by the complex-figure/);
});

test('frame, seed and replay changes do not invent text or replace stable block identities', () => {
  const state = snapshot([block('prompt-instance', 1, {text: 'Choose a point.'})]);
  const first = renderToStaticMarkup(createElement(LessonTextPresentation, {snapshot: state, template: 'explanation'}));
  const later = renderToStaticMarkup(createElement(LessonTextPresentation, {
    snapshot: {...state, identity: {...state.identity, frame: 20, replay: 2, seed: 99}}, template: 'explanation',
  }));
  assert.equal(later, first, 'the passed presentation snapshot, not a separate timing model, controls output');
});
