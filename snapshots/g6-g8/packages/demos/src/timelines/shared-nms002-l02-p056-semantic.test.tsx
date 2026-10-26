import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {P056SemanticView, p056SemanticSnapshot, p056TermRequest} from '../nms-l02-p056-semantic-view-v1';

const render = (frame: number, uiLanguage: 'en' | 'es' = 'en', interactive = false) =>
  renderToStaticMarkup(<P056SemanticView teachingFrame={frame} uiLanguage={uiLanguage}
    {...(interactive ? {onTermRequest: () => {}} : {})} />);

test('P056 teaching text follows source frame boundaries without a second clock', () => {
  assert.deepEqual(p056SemanticSnapshot(1), {
    teachingFrame: 1, headingAlpha: 0, stepTwoAlpha: 0,
    haveQuestionAlpha: 0, needQuestionAlpha: 0, glossaryReady: false,
    highlightedTerm: null,
  });
  assert.equal(p056SemanticSnapshot(9).headingAlpha, 0);
  assert.equal(p056SemanticSnapshot(10).headingAlpha, 32 / 256);
  assert.equal(p056SemanticSnapshot(16).glossaryReady, false);
  assert.equal(p056SemanticSnapshot(17).headingAlpha, 1);
  assert.equal(p056SemanticSnapshot(17).stepTwoAlpha, 1);
  assert.equal(p056SemanticSnapshot(17).glossaryReady, true);
  assert.equal(p056SemanticSnapshot(32).highlightedTerm, 'Organize');
  assert.equal(p056SemanticSnapshot(33).highlightedTerm, null);
  assert.equal(p056SemanticSnapshot(42).highlightedTerm, 'Information');
  assert.equal(p056SemanticSnapshot(102).haveQuestionAlpha, 0);
  assert.equal(p056SemanticSnapshot(103).haveQuestionAlpha, 28 / 256);
  assert.equal(p056SemanticSnapshot(111).haveQuestionAlpha, 1);
  assert.equal(p056SemanticSnapshot(154).needQuestionAlpha, 0);
  assert.equal(p056SemanticSnapshot(155).needQuestionAlpha, 28 / 256);
  assert.equal(p056SemanticSnapshot(163).needQuestionAlpha, 1);
  assert.equal(p056SemanticSnapshot(234).needQuestionAlpha, 1);
  for (const frame of [0, 235, 1.5, Number.NaN]) {
    assert.throws(() => p056SemanticSnapshot(frame), RangeError);
  }
});

test('semantic candidate preserves source text and intentionally empty plan steps', () => {
  const first = render(1);
  assert.match(first, /Restate the question\./u);
  assert.doesNotMatch(first, /<h2/u);
  assert.doesNotMatch(first, /Organize the information\./u);
  const final = render(234);
  assert.match(final, /What information do I have\?/u);
  assert.match(final, /What information do I need\?/u);
  assert.match(final, /Organize the information\./u);
  assert.match(final, /Step 3 has no source text on this page\./u);
  assert.match(final, /Step 4 has no source text on this page\./u);
  assert.equal((final.match(/<li\b/gu) ?? []).length, 6);
  assert.match(final, /data-registered-current-javascript="false"/u);
  assert.match(final, /data-source-audio-enabled="false"/u);
});

test('term controls appear only when fully visible and a resolver is supplied', () => {
  assert.doesNotMatch(render(16, 'en', true), /<button/u);
  assert.doesNotMatch(render(17), /<button/u);
  const ready = render(17, 'en', true);
  assert.equal((ready.match(/<button\b/gu) ?? []).length, 2);
  assert.match(ready, /data-source-key="Organize"/u);
  assert.match(ready, /data-source-key="Information"/u);
  assert.deepEqual(p056TermRequest(17, 16), {
    animationId: 'shared-nms002-l02-p056', teachingFrame: 17,
    characterId: 16, sourceKeyAttribute: 'Organize',
  });
  assert.deepEqual(p056TermRequest(17, 17), {
    animationId: 'shared-nms002-l02-p056', teachingFrame: 17,
    characterId: 17, sourceKeyAttribute: 'Information',
  });
  assert.throws(() => p056TermRequest(16, 16), /not fully visible/u);
});

test('Spanish UI remains explicitly labelled English source fallback, not a translation', () => {
  const html = render(234, 'es');
  assert.match(html, /data-ui-language="es"/u);
  assert.match(html, /data-language-policy="source-fallback" lang="en"/u);
  assert.match(html, /What information do I need\?/u);
  assert.doesNotMatch(html, /¿Qué información necesito\?/u);
});
