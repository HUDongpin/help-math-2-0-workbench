import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import type {RuntimeContext} from '../contract';
import {createNmsL09P003Clock} from
  './shared-nms002-l09-p003-source-clock';
import {projectNmsL09P003Text} from
  './shared-nms002-l09-p003-source-text';
import {NmsL09P003NativeText} from
  './shared-nms002-l09-p003-native-text';

function htmlAt(frame: number, lang: 'en' | 'es' = 'en') {
  const clock = createNmsL09P003Clock(frame);
  const context: RuntimeContext = {frame, frameDomain: 'sprite-246',
    rootFrame: 6, scenario: 'source-static-frame', lang, seed: 0,
    replay: 0};
  const state = projectNmsL09P003Text(clock, context);
  return renderToStaticMarkup(<NmsL09P003NativeText
    snapshot={state.snapshot} emphasisRow={state.emphasisRow}/>);
}

test('native page has one heading and one copy of each teaching row', () => {
  const html = htmlAt(1);
  assert.equal((html.match(/Daily Fish Feeding Schedule/gu) ?? []).length, 1);
  assert.equal((html.match(/data-lesson-text-block="schedule-heading"/gu) ?? []).length, 1);
  assert.equal((html.match(/data-lesson-text-block="schedule-heading-second-layer"/gu) ?? []).length, 0);
  for (const id of ['tank-one', 'addend-one', 'addend-two', 'addend-three', 'total'])
    assert.equal((html.match(new RegExp(`data-lesson-text-block="${id}"`, 'gu')) ?? []).length, 1);
  assert.doesNotMatch(html, /data-lesson-text-block="expression"/u);
  assert.doesNotMatch(html, /emphasis-copy-/u);
});

test('formula appears only at the five source reveal boundaries', () => {
  for (const [frame, text] of [[590, null], [591, '5'], [599, '5 +'],
    [605, '5 + 3'], [612, '5 + 3 ×'], [616, '5 + 3 × 2'],
    [635, '5 + 3 × 2']] as const) {
    const html = htmlAt(frame);
    if (text === null) assert.doesNotMatch(html, /data-lesson-text-block="expression"/u);
    else assert.equal(html.match(/data-lesson-text-block="expression"[^>]*>([^<]*)<\/p>/u)?.[1], text);
  }
});

test('source row emphasis is one semantic row, not a second reading item', () => {
  for (const [frame, id] of [[590, 'tank-one'], [592, 'tank-one'],
    [594, 'tank-one'], [615, 'addend-one'], [617, 'addend-one'],
    [619, 'addend-one']] as const) {
    const html = htmlAt(frame);
    assert.match(html, new RegExp(`data-lesson-text-block="${id}" data-emphasis="true"`, 'u'));
    assert.equal((html.match(/data-emphasis="true"/gu) ?? []).length, 1);
  }
  assert.doesNotMatch(htmlAt(620), /data-emphasis="true"/u);
});

test('ES path retains source English words without inventing a translation', () => {
  const html = htmlAt(616, 'es');
  assert.match(html, /lang="en"/u);
  assert.match(html, /5 \+ 3 × 2/u);
  assert.doesNotMatch(html, /lang="es"/u);
});
