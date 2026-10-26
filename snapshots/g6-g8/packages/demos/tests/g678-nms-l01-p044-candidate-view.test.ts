import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NmsL01P044CandidateView} from '../src/g678-nms-l01-p044-candidate-view';
import {createP044State, queryP044, reduceP044, type P044Event, type P044State} from '../src/g678-nms-l01-p044-controller';
const view = (state: P044State, uiLanguage: 'en' | 'es' = 'en') => renderToStaticMarkup(React.createElement(NmsL01P044CandidateView, {
  query: queryP044(state), uiLanguage, mountVisual: async () => ({render() {throw new Error('SSR must not render canvas');}}),
  onEvent() {throw new Error('SSR must not dispatch');}, onVisualReady() {throw new Error('SSR must not load');},
}));
function toQuiz() {
  let state=createP044State();
  for (const frame of [312,449,575,697,737] as const) {
    state=reduceP044(state,{type:'main-frame',epoch:state.epoch,clockToken:state.clockToken,frame}).state;
    if(frame===737)return state;
    state=reduceP044(state,{type:'continue',epoch:state.epoch,stopFrame:frame,sourceTarget:43,input:'mouse'}).state;
  }
  throw new Error('unreachable');
}
test('source frame1 alpha0 exposes neither question nor glossary action', () => {
  const markup=view(createP044State());assert.ok(!markup.includes('data-p044-glossary='));assert.ok(!markup.includes('<h2'));
  assert.ok(markup.includes('width="800" height="600"'));assert.ok(markup.includes('data-visual-status="loading"'));
});
test('readable question preserves all source literal text, quantities and punctuation', () => {
  const source=readFileSync(new URL('../../../work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v1/export/texts/17.txt',import.meta.url),'utf8');
  const literal=source.replaceAll('--- RECORDSEPARATOR ---','').replace(/\s+/g,' ').trim();
  const state=reduceP044(createP044State(),{type:'main-frame',epoch:0,clockToken:0,frame:20}).state;
  assert.ok(view(state).includes(literal));assert.ok(view(state,'es').includes(literal));
});
test('four choices retain duplicate symbol143 as two separate named/depth controls', () => {
  const markup=view(toQuiz());assert.equal((markup.match(/data-p044-answer=/g)??[]).length,4);
  for (const label of ['A. $43.00','B. $120.00','C. $140.00','D. $160.00']) assert.ok(markup.includes(label));
  assert.equal((markup.match(/data-source-character-id="143"/g)??[]).length,2);
  assert.ok(markup.includes('data-source-depth="207"'));assert.ok(markup.includes('data-source-depth="203"'));
  assert.ok(!markup.includes('data-outcome='));assert.ok(!markup.includes('answer is'));
});
test('loading scene cannot expose enabled answer or Continue buttons', () => {
  const markup=view(toQuiz());
  for (const button of markup.matchAll(/<button\b[^>]*>/g))assert.ok(button[0].includes('disabled=""'));
});
test('candidate metadata never advertises registration, calibration or source audio acceptance', () => {
  const markup=view(toQuiz(),'es');assert.ok(markup.includes('data-current-javascript-registered="false"'));
  assert.ok(markup.includes('data-product-calibration-passed="false"'));assert.ok(markup.includes('data-source-audio="unintegrated"'));
  assert.ok(markup.includes('data-unbound-source-write="a_text"'));assert.ok(markup.includes('Vista de ingeniería sin registrar'));
});
