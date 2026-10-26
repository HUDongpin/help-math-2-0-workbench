import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { P061_DISPLAY_META, p061SourceObjects } from '../src/generated/nms-l02-p061-display-list-v1';
import {
  NmsL02P061ProductRendererV1, P061HintContent, type P061VisualProps,
} from '../src/nms-l02-p061-product-renderer-v1';

const html = (mainFrame: number, options: Partial<P061VisualProps> = {}) =>
  renderToStaticMarkup(<NmsL02P061ProductRendererV1 mainFrame={mainFrame} uiLanguage="en" {...options} />);

test('P061 source text remains hidden until each authored teaching entry', () => {
  assert.equal(P061_DISPLAY_META.sourceSwfSha256, '4712cc077841cc0d16ea63c0c10827b933a0904a80eef010ec8f04eed5ffa50a');
  assert.equal(p061SourceObjects('315', 6, 22)[0]?.color[3], 0);
  assert.equal(p061SourceObjects('315', 7, 22)[0]?.color[3], 64);
  assert.equal(p061SourceObjects('315', 9, 38).length, 0);
  assert.equal(p061SourceObjects('315', 10, 38)[0]?.color[3], 256);
  const beforeQuestion = html(9), question = html(10);
  assert.doesNotMatch(beforeQuestion, /A car dealer claims/);
  assert.match(question, /A car dealer claims/);
  assert.doesNotMatch(html(93), /Taylor paid \$1,000/);
  assert.match(html(94), /Taylor paid \$1,000/);
  assert.doesNotMatch(html(185), /how much can he expect/);
  assert.match(html(186), /how much can he expect/);
});

test('given, equivalent-decimal, and subtraction strategies reveal at distinct source frames', () => {
  assert.doesNotMatch(html(573), /data-p061-panel="given-needed"/);
  assert.match(html(574), /data-p061-panel="given-needed"/);
  assert.doesNotMatch(html(700), /data-p061-strategy="equivalent-decimal"/);
  assert.equal(p061SourceObjects('315', 700, 95).length, 0);
  assert.equal(p061SourceObjects('315', 701, 95).length, 1);
  assert.equal(p061SourceObjects('111', 1, 95).length, 1);
  const first = html(701);
  assert.match(first, /data-p061-strategy="equivalent-decimal"/);
  assert.match(first, /data-source-text-id="98" data-source-shape-id="95"/);
  assert.match(first, /100% − 25% of gas cost/);
  assert.doesNotMatch(first, /100% 25% of gas cost/);
  assert.match(first, /data-source-text-id="97 100"/);
  assert.match(first, /data-source-derived-formula="percent-definition"/);
  assert.match(first, /data-source-derived="percent-definition"/);
  assert.match(first, /75%/);
  assert.match(first, /New Gas Cost = Last Cost/);
  assert.doesNotMatch(html(817), /data-p061-strategy="subtract-decrease"/);
  const second = html(818);
  assert.match(second, /data-p061-strategy="subtract-decrease"/);
  assert.match(second, /\$1,000 – \$250 = \$750/);
  assert.match(second, /data-p061-modern-cost-diagram="source-derived"/);
  assert.doesNotMatch(second, /This angle measures|The angle looks like/);
});

test('nested boxes use independent local frames and remain unavailable at the wrong main stop', () => {
  const first = html(700, { box: { spriteId: 111, localFrame: 15 } });
  const second = html(817, { box: { spriteId: 118, localFrame: 21 } });
  assert.match(first, /data-source-box-sprite="111"/);
  assert.match(first, /data-source-box-local-frame="15"/);
  assert.match(first, /data-p061-strategy="equivalent-decimal"/);
  assert.match(second, /data-source-box-sprite="118"/);
  assert.match(second, /data-p061-strategy="subtract-decrease"/);
  assert.match(html(700, { box: { spriteId: 118, localFrame: 1 } }), /data-p061-status="invalid-source-state"/);
  assert.match(html(817, { box: { spriteId: 111, localFrame: 1 } }), /data-p061-status="invalid-source-state"/);
});

test('final answer, hint, feedback and terminal are separate source states', () => {
  const finalQuiz = html(860);
  assert.match(finalQuiz, /data-source-answer="2" data-source-hit-object-id="122"/);
  assert.match(finalQuiz, /<strong>B\.<\/strong> \$750/);
  assert.match(finalQuiz, /data-source-control-label="Need More Help"/);
  const controls = html(860, { answerControls: <div data-native-answers="true"><button type="button">B. $750</button></div> });
  assert.match(controls, /data-native-answers="true"/);
  assert.doesNotMatch(controls, /data-source-answer="2"/);
  const hint = html(860, { popupOpen: true });
  assert.match(hint, /data-source-popup-sprite="314"/);
  assert.match(hint, /data-source-derived-formula="percent-definition"/);
  assert.doesNotMatch(hint, /data-source-text-id="302 309"/);
  assert.match(hint, /Cost with Discount/);
  assert.match(renderToStaticMarkup(<P061HintContent />), /data-source-text-id="302"/);
  assert.match(html(860, { feedback: { spriteId: 134, localFrame: 15 } }), /Incorrect!/);
  assert.match(html(879), /data-source-terminal-frame="879"/);
  assert.doesNotMatch(html(879), /data-source-interactive="true"/);
});

test('Spanish fallback and impossible source states fail closed', () => {
  assert.match(html(860, { uiLanguage: 'es' }), /Texto original en inglés/);
  assert.match(html(859, { popupOpen: true }), /data-p061-status="invalid-source-state"/);
  assert.match(html(700, { answerControls: <span>early</span> }), /data-p061-status="invalid-source-state"/);
  assert.match(html(880), /data-p061-status="invalid-source-state"/);
  assert.match(html(860, { feedback: { spriteId: 134, localFrame: 30 } }), /data-p061-status="invalid-source-state"/);
});
