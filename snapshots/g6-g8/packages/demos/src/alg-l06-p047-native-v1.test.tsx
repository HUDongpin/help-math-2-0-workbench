import React from 'react';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderToStaticMarkup} from 'react-dom/server';
import test from 'node:test';
import {P047NativeQuizV1, P047_NATIVE_SHA256} from './alg-l06-p047-native-v1';
import {initialP047State, reduceP047, type P047State, type P047Event} from './alg-l06-p047-state-v1';
function apply(s: P047State, event: Record<string, unknown>) {
  const r = reduceP047(s, {...event, epoch: s.epoch} as P047Event);
  assert.equal(r.accepted, true, r.reason); return r.state;
}
function quiz() {
  return apply(apply(initialP047State(), {type: 'play'}), {type: 'advance-main', frame: 208});
}
const render = (state: P047State, language: 'en' | 'es' = 'en') =>
  renderToStaticMarkup(<P047NativeQuizV1 state={state} language={language} onEvent={e => reduceP047(state, e)}/>);

test('native bindings pin exact source value order, semantic table and all five named destinations', () => {
  const bytes = readFileSync(new URL('../../../migrations/shared-alg001-l06-p047/native-v1/native-bindings-v1.json', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), P047_NATIVE_SHA256);
  const html = render(quiz());
  assert.deepEqual([...html.matchAll(/data-p047-source="(\d)"/g)].map(m => m[1]), ['4', '2', '1', '5', '3']);
  assert.deepEqual([...html.matchAll(/data-p047-target="(\d)"/g)].map(m => m[1]), ['1', '2', '3', '4', '5']);
  assert.match(html, /<table/); assert.match(html, /scope="col"/);
  assert.match(html, /data-source-text-id="35">–6/);
  assert.match(html, /aria-label="Output, row 1"/);
  assert.doesNotMatch(html, /data-p047-placed/);
  assert.equal(render(initialP047State()), '');
});

test('successful source becomes fixed in its correct row; wrong feedback and help use original text IDs', () => {
  let s = apply(quiz(), {type: 'pick', id: 1});
  s = apply(s, {type: 'drop', id: 1, target: 1, token: s.selection!.token});
  let html = render(s);
  assert.match(html, /data-p047-placed="1" data-source-card="1" data-source-text-id="40">6/);
  assert.doesNotMatch(html, /data-p047-target="1"/);
  s = apply(s, {type: 'pick', id: 2});
  s = apply(s, {type: 'drop', id: 2, target: 4, token: s.selection!.token});
  assert.match(render(s), /data-source-text-id="66">\s*Try again\./);
  s = apply(s, {type: 'open-nmh'}); html = render(s, 'es');
  for (const id of [85, 86, 87, 88]) assert.ok(html.includes(`data-source-text-id="${id}"`));
  assert.match(html, /data-source-button-id="90">X-coordinate/);
  assert.match(html, /Cerrar/); assert.match(html, /lang="en"/);
});

test('solved native table remains at source208 after coach completion and disappears at209', () => {
  let s = quiz();
  for (const id of [1, 2, 3, 4, 5]) {
    s = apply(s, {type: 'pick', id});
    s = apply(s, {type: 'drop', id, target: id, token: s.selection!.token});
  }
  s = apply(s, {type: 'advance-coach', kind: 'right', frame: 20, token: s.coaches.right!.token});
  assert.equal(s.phase, 'explanation'); assert.equal(s.mainFrame, 208);
  assert.equal([...render(s).matchAll(/data-p047-placed=/g)].length, 5);
  s = apply(s, {type: 'advance-main', frame: 209});
  assert.equal(render(s), '');
});


test('quiz graph exposes five mathematical points and does not print later coordinate labels',()=>{
  const html=render(quiz());
  assert.equal([...html.matchAll(/data-source-point=/g)].length,5);
  assert.match(html,/data-source-curve="27"/);
  assert.match(html,/M -2050 -1050 Q -2486 2099 -4009 2514 -5496 2131 -5952 -1040/);
  assert.match(html,/6, card 1/);assert.match(html,/6, card 2/);
  for(const id of [96,97,98,99,100])assert(!html.includes(`data-source-text-id="${id}"`));
  let s=apply(quiz(),{type:'pick',id:5});s=apply(s,{type:'drop',id:5,target:1,token:s.selection!.token});
  assert.match(render(s),/data-p047-placed="1" data-source-card="5" data-source-text-id="40">6/);
});
