import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import source from './generated/g4-l3-ts005-text.json';
import {G4L3Ts005Scene, getTs005SceneState} from './g4-l3-ts005-scene';

test('source runs recover the four-step plan and both strategy columns', () => {
  const state = getTs005SceneState(275);
  assert.deepEqual(state.numbers, ['1.', '2.', '3.', '4.']);
  assert.deepEqual(state.plan, [source.texts['11'].text, source.texts['13'].text,
    source.texts['15'].text, source.texts['16'].text]);
  assert.equal(state.activeStep, '4 Check your work.');
  assert.deepEqual(state.left.map(item => item.text), [
    'write an equation and solve it', 'draw a picture',
    'look for a pattern', 'systematically guess and check',
  ]);
  assert.deepEqual(state.right.map(item => item.text), [
    'act it out', 'make a table', 'work a simpler problem', 'work backwards',
  ]);
  const html = renderToStaticMarkup(<G4L3Ts005Scene frame={275}/>);
  assert.equal((html.match(/data-lesson-text-block="step-[1-4]-number"/g) ?? []).length, 4);
  assert.equal((html.match(/data-lesson-text-block="(?:left|right)-[1-4]"/g) ?? []).length, 8);
  assert.equal((html.match(/data-lesson-text-block="show-work"/g) ?? []).length, 1);
  assert(!html.includes('<canvas'));
  assert(!html.includes('<img'));
  assert(!html.includes('data-source-button='), 'source glossary hit roles are not yet bound');
  assert(!html.includes('Map</button>'), 'old Flash course shell controls are excluded');
});

test('all source frames govern native text reveal and duplicate Show overlay is not duplicate copy', () => {
  for (let frame = 1; frame <= source.frameCount; frame++) {
    const state = getTs005SceneState(frame);
    const alpha = (id: number) => Math.max(0, ...source.frames[frame - 1].placements
      .filter(item => item.characterId === id).map(item => item.alpha));
    assert.equal(state.activeStep !== null, alpha(16) > 0 && alpha(18) > 0, `step ${frame}`);
    assert.equal(state.plan[3] !== null, alpha(16) > 0, `plan ${frame}`);
    assert.equal(state.strategiesHeading !== null, alpha(20) > 0, `strategies ${frame}`);
    assert.equal(state.left[0].opacity, alpha(27), `left ${frame}`);
    assert.equal(state.right[0].opacity, alpha(25), `right ${frame}`);
    assert.equal(state.showWork !== null, alpha(33) > 0, `show ${frame}`);
    assert.equal(state.showWorkEmphasis, alpha(35) > 0, `emphasis ${frame}`);
  }
  assert.equal(getTs005SceneState(104).strategiesHeading, null);
  assert.equal(getTs005SceneState(105).strategiesHeading, source.texts['20'].text.trim());
  assert.equal(getTs005SceneState(238).showWork, null);
  assert.equal(getTs005SceneState(239).showWork, 'Show your work.');
  assert.equal(getTs005SceneState(243).showWorkEmphasis, true);
  const html = renderToStaticMarkup(<G4L3Ts005Scene frame={243}/>);
  assert.equal((html.match(/<span>Show<\/span> your work\.<\/p>/g) ?? []).length, 1);
});

test('native glossary words follow exact source button windows and never add shell controls', () => {
  const onOpenKeyTerm = () => {};
  const expected = new Map([
    [111, []],
    [112, [23]],
    [146, [23]],
    [147, [23, 28, 29, 30, 31]],
    [246, [23, 28, 29, 30, 31]],
    [247, [23, 30, 36, 37, 38, 39]],
    [275, [23, 30, 36, 37, 38, 39]],
  ]);
  for (const [frame, ids] of expected) {
    const state = getTs005SceneState(frame);
    assert.deepEqual(state.buttons.map(item => item.buttonId), ids, `frame ${frame}`);
    const html = renderToStaticMarkup(<G4L3Ts005Scene frame={frame}
      onOpenKeyTerm={onOpenKeyTerm}/>);
    assert.deepEqual([...html.matchAll(/data-source-button="(\d+)"/g)]
      .map(match => Number(match[1])).sort((a, b) => a - b),
    [...ids].sort((a, b) => a - b), `native controls at frame ${frame}`);
    assert(!html.includes('lesson-shell2__legacy-hit'));
    assert(!html.includes('Map</button>'));
  }
  const at247 = getTs005SceneState(247);
  assert.equal(at247.buttons.find(item => item.buttonId === 36)?.entryId,
    source.glossary.find(item => item.buttonId === 28)?.entryId);
  assert.equal(at247.buttons.find(item => item.buttonId === 37)?.entryId,
    source.glossary.find(item => item.buttonId === 29)?.entryId);
  assert.equal(at247.buttons.find(item => item.buttonId === 38)?.entryId,
    source.glossary.find(item => item.buttonId === 31)?.entryId);
});

test('narrow native layout and reduced-motion frame state remain explicit', () => {
  const html = renderToStaticMarkup(<G4L3Ts005Scene frame={141} reducedMotion/>);
  assert.match(html, /@container \(max-width:34rem\)/);
  assert.match(html, /@container \(max-width:22rem\)/);
  assert.equal(getTs005SceneState(140, true).left[0].opacity, 1);
  assert.equal(getTs005SceneState(140, true).right[0].opacity, 1);
  assert.equal(getTs005SceneState(243, true).showWorkEmphasis, false);
  for (const frame of [0, -1, 1.5, 276, NaN]) {
    assert.throws(() => getTs005SceneState(frame));
  }
});
