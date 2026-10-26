import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {p031AnswerRequest, p031SourceState, type P031Choice} from './alg-l06-p031-source-v1';
import {P031NativeV1} from './alg-l06-p031-native-v1';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const intake = JSON.parse(fs.readFileSync(path.join(root, 'migrations/shared-alg001-l06-p031/audit-v1/source-extraction-v1.json'), 'utf8'));
const script = (button: number) => fs.readFileSync(path.join(intake.exportRoot,
  `scripts/DefineButton2_${button}/BUTTONCONDACTION on(release).as`), 'utf8');

test('native source text and glossary appear at exact authored boundaries', () => {
  for (const [first, id] of [[103, 6], [172, 8], [246, 10], [294, 14], [320, 15], [361, 16], [421, 18]]) {
    assert(!p031SourceState(first! - 1).narrative.some(row => row.textId === id));
    assert(p031SourceState(first!).narrative.some(row => row.textId === id));
  }
  assert.equal(p031SourceState(245).glossary.length, 0);
  assert.deepEqual(p031SourceState(246).glossary.map(row => row.key), ['Function', 'Calculate']);
  assert.deepEqual(p031SourceState(421).glossary.map(row => row.key), ['Function', 'Calculate', 'Domain']);
  assert.equal(p031SourceState(513).options.length, 0); // Authored initial alpha is zero.
  assert.equal(p031SourceState(514).options.length, 5);
});

test('all 1611 states preserve one-frame answer lifetime without creating a held quiz', () => {
  let buttonFrames = 0;
  for (let frame = 1; frame <= 1611; frame++) {
    const state = p031SourceState(frame);
    assert.equal(state.sourceHasStopAtFrame, false);
    assert.equal(state.lessonCompleted, false);
    if (state.options.some(row => row.sourceButtonPresent)) {assert.equal(frame, 1610); buttonFrames++;}
  }
  assert.equal(buttonFrames, 1);
  for (const frame of [1, 513, 1609, 1611]) assert.throws(() => p031AnswerRequest(frame, 'A', {quizTryCount: 0, wrongFeed: null}));
});

test('A-E binding and page-owned global effects agree with original release scripts', () => {
  const expected = [['A', 87, 'Counting numbers  '], ['B', 86, 'Rational numbers'],
    ['C', 88, 'Whole numbers'], ['D', 89, 'Real numbers'], ['E', 89, 'Integers']] as const;
  assert.deepEqual(p031SourceState(1610).options.map(x => [x.letter, x.buttonId, x.text]), expected);
  for (const [choice, id] of expected) {
    const result = p031AnswerRequest(1610, choice, {quizTryCount: 0, wrongFeed: null});
    assert.equal(result.buttonId, id);
    assert.match(script(id), /_root.disableQuizButton\(\)/);
    assert.equal(script(id).includes('showRightFeed'), choice === 'A');
    assert.equal(result.globals.quizTryCount, choice === 'A' ? 0 : 1);
    assert.equal(result.calls[1], choice === 'A' ? 'showRightFeed' : 'showWrongFeed');
    assert.equal(result.selectedFeedback, null);
    assert.equal(result.parentStopRequested, false);
    assert.equal(result.status, 'unresolved-host-request');
  }
  const old = {quizTryCount: 3, wrongFeed: 'prior source global'};
  assert.deepEqual(p031AnswerRequest(1610, 'B', old).globals, {...old, quizTryCount: 4});
  assert.deepEqual(p031AnswerRequest(1610, 'A', old).globals, old);
  assert.equal(old.quizTryCount, 3);
});

test('query validation rejects missing, fractional, unsafe and forged states', () => {
  for (const frame of [0, 1612, 1.1, NaN, Infinity]) assert.throws(() => p031SourceState(frame));
  assert.throws(() => p031AnswerRequest(1610, 'Z' as P031Choice, {quizTryCount: 0, wrongFeed: null}));
  for (const count of [-1, 1.5, Number.MAX_SAFE_INTEGER, Infinity])
    assert.throws(() => p031AnswerRequest(1610, 'B', {quizTryCount: count, wrongFeed: null}));
});

test('native EN/ES keeps English teaching copy, source controls and reduced-motion emphasis', () => {
  const unbound = renderToStaticMarkup(React.createElement(P031NativeV1, {frame: 1610}));
  assert.doesNotMatch(unbound, /data-source-button-id=/);
  assert.equal((unbound.match(/disabled=""/g) ?? []).length, 3);
  for (const language of ['en', 'es'] as const) {
    const render = (frame: number, reducedMotion = false) => renderToStaticMarkup(React.createElement(P031NativeV1,
      {frame, language, reducedMotion, onGlossary: () => {}, onAnswerRequest: () => {}}));
    assert.doesNotMatch(render(1609), /data-source-button-id=/);
    assert.equal((render(1610).match(/data-source-button-id=/g) ?? []).length, 5);
    assert.doesNotMatch(render(1611), /data-source-button-id=/);
    assert.match(render(1611), /Counting numbers/);
    assert.match(render(1611), /lang="en"/);
    assert.equal((render(421).match(/data-source-glossary-id=/g) ?? []).length, 3);
    assert.match(render(320), /data-source-text-group="14,15"[^>]*><span data-source-text-id="14">V = <\/span><span data-source-text-id="15">0.5F<\/span><\/p>/);
    assert(!render(769).includes('outline:2px'));
    assert(render(769, true).includes('outline:2px'));
  }
});
