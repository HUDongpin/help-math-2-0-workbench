import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import source from './generated/g4-l3-ts006-text.json';
import {G4L3Ts006Scene, getTs006SceneState} from './g4-l3-ts006-scene';

test('TS006 native plan keeps all four shipped source instructions and two-by-two relationship', () => {
  const state = getTs006SceneState(1);
  assert.equal(state.title, 'Negative Numbers: Practice Test');
  assert.deepEqual(state.steps, [
    {number: '1.', copy: 'Restate the question.'},
    {number: '2.', copy: 'Organize the information.'},
    {number: '3.', copy: 'Solve the problem.'},
    {number: '4.', copy: 'Check your answer.'},
  ]);
  const html = renderToStaticMarkup(<G4L3Ts006Scene frame={1}/>);
  assert.match(html, /grid-template-areas:'one three' 'two four'/);
  assert.match(html, /grid-template-areas:'one' 'two' 'three' 'four'/);
  assert.match(html, /@container \(max-width:16rem\)/);
  assert.equal((html.match(/data-lesson-text-block="step-[1-4]"/g) ?? []).length, 4);
  assert(html.includes('data-source-companion="sprite-3"'));
  assert(html.includes('data-source-shape="4"'));
  assert(!html.includes('<canvas'));
  assert(!html.includes('<img'));
  assert(!html.includes('<button'));
  assert(!html.includes('lesson-shell'));
});

test('source contains one persistent four-step state through all 128 frames', () => {
  assert.equal(source.frameCount, 128);
  assert.equal(source.placedAtFrameOne.length, 20);
  const first = getTs006SceneState(1);
  for (let frame = 1; frame <= source.frameCount; frame++) {
    const state = getTs006SceneState(frame);
    assert.deepEqual(state.steps, first.steps);
    assert.equal(state.frame, frame);
  }
  for (const frame of [0, -1, 1.5, 129, NaN]) {
    assert.throws(() => getTs006SceneState(frame));
  }
});
