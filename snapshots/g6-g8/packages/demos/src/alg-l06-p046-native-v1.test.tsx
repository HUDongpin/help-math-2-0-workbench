import React from 'react';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderToStaticMarkup} from 'react-dom/server';
import test from 'node:test';
import {P046NativeQuizV1, P046_NATIVE_SHA256} from './alg-l06-p046-native-v1';
import {initialP046State, reduceP046, type P046State, type P046Event} from './alg-l06-p046-state-v1';
function apply(s: P046State, event: Record<string, unknown>) {
  const r = reduceP046(s, {...event, epoch: s.epoch} as P046Event);
  assert.equal(r.accepted, true, r.reason); return r.state;
}
function quiz() {
  return apply(apply(initialP046State(), {type: 'play'}), {type: 'advance-main', frame: 163});
}
const render = (state: P046State, language: 'en' | 'es' = 'en') =>
  renderToStaticMarkup(<P046NativeQuizV1 state={state} language={language} onEvent={e => reduceP046(state, e)}/>);

test('native bindings pin exact source value order, semantic table and all five named destinations', () => {
  const bytes = readFileSync(new URL('../../../migrations/shared-alg001-l06-p046/native-v1/native-bindings-v1.json', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), P046_NATIVE_SHA256);
  const html = render(quiz());
  assert.deepEqual([...html.matchAll(/data-p046-source="(\d)"/g)].map(m => m[1]), ['3', '1', '5', '2', '4']);
  assert.deepEqual([...html.matchAll(/data-p046-target="(\d)"/g)].map(m => m[1]), ['1', '2', '3', '4', '5']);
  assert.match(html, /<table/); assert.match(html, /scope="col"/);
  assert.match(html, /data-source-text-id="22">–14/);
  assert.match(html, /aria-label="Input, row 1"/);
  assert.doesNotMatch(html, /data-p046-placed/);
  assert.equal(render(initialP046State()), '');
});

test('successful source becomes fixed in its correct row; wrong feedback and help use original text IDs', () => {
  let s = apply(quiz(), {type: 'pick', id: 1});
  s = apply(s, {type: 'drop', id: 1, target: 1, token: s.selection!.token});
  let html = render(s);
  assert.match(html, /data-p046-placed="1" data-source-text-id="31">–3/);
  assert.doesNotMatch(html, /data-p046-target="1"/);
  s = apply(s, {type: 'pick', id: 2});
  s = apply(s, {type: 'drop', id: 2, target: 4, token: s.selection!.token});
  assert.match(render(s), /data-source-text-id="57">\s*Try again\./);
  s = apply(s, {type: 'open-nmh'}); html = render(s, 'es');
  for (const id of [76, 77, 78, 79]) assert.ok(html.includes(`data-source-text-id="${id}"`));
  assert.match(html, /data-source-button-id="84">Equation/);
  assert.match(html, /Cerrar/); assert.match(html, /lang="en"/);
});

test('solved native table remains at source163 after coach completion and disappears at164', () => {
  let s = quiz();
  for (const id of [1, 2, 3, 4, 5]) {
    s = apply(s, {type: 'pick', id});
    s = apply(s, {type: 'drop', id, target: id, token: s.selection!.token});
  }
  s = apply(s, {type: 'advance-coach', kind: 'right', frame: 20, token: s.coaches.right!.token});
  assert.equal(s.phase, 'explanation'); assert.equal(s.mainFrame, 163);
  assert.equal([...render(s).matchAll(/data-p046-placed=/g)].length, 5);
  s = apply(s, {type: 'advance-main', frame: 164});
  assert.equal(render(s), '');
});
