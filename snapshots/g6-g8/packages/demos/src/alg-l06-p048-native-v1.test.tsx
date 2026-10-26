import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import bindings from '../../../migrations/shared-alg001-l06-p048/native-v1/native-bindings-v2.json';
import {P048NativeV1,P048SourceGraph,p048VisibleGlossary} from './alg-l06-p048-native-v1';
import {initialP048State,reduceP048,type P048State,type P048Event} from './alg-l06-p048-state-v1';
function act(s:P048State,type:string,fields:Partial<P048Event>={}){
  const r=reduceP048(s,{type,epoch:s.epoch,quizGeneration:s.quizGeneration,...fields});
  assert.ok(r.accepted,r.reason);return r.state;
}
function quiz(){return act(act(initialP048State(),'start-main'),'advance-main',{frame:224});}
test('native choices retain text and the counterintuitive A/AnsBtn2 binding',()=>{
  const html=renderToStaticMarkup(<P048NativeV1 state={quiz()} onEvent={()=>{}}/>);
  assert.match(html,/data-source-choice="A" data-source-instance="AnsBtn2"/);
  for(const x of Object.values(bindings.options))assert.ok(html.includes(x.text.trim()));
  assert.doesNotMatch(html,/Hurricane|Decade/);
});
test('exact source curve is retained; later highlight appears only from281',()=>{
  const before=renderToStaticMarkup(<P048SourceGraph frame={280}/>);
  const after=renderToStaticMarkup(<P048SourceGraph frame={281}/>);
  assert.ok(before.includes('M464.5 394.05 Q465.2 365.15'));
  assert.doesNotMatch(before,/data-source-shape-id="347"/);
  assert.match(after,/data-source-shape-id="347"/);
  assert.equal(bindings.graph.paths.filter(x=>x.shapeId===157).length,4);
  assert.equal(bindings.graph.labels.length,11);
});
test('source continuation hides B/C/D at260 and keeps A through327',()=>{
  for(const frame of [259,260,327]){
    const s={...quiz(),mainFrame:frame};
    const html=renderToStaticMarkup(<P048NativeV1 state={s}/>);
    assert.equal((html.match(/data-source-choice=/g)??[]).length,frame<260?4:1);
    assert.match(html,/data-source-choice="A"/);
  }
});
test('wrong message starts at source popup16; Close remains disabled until22',()=>{
  let s=act(quiz(),'choose',{choice:'B'});
  s=act(s,'advance-feedback',{token:s.feedback!.token,frame:15});
  assert.doesNotMatch(renderToStaticMarkup(<P048NativeV1 state={s}/>),/Study the graph carefully/);
  s=act(s,'advance-feedback',{token:s.feedback!.token,frame:16});
  let html=renderToStaticMarkup(<P048NativeV1 state={s} onEvent={()=>{}} language="es"/>);
  assert.match(html,/Study the graph carefully.Try again./);
  assert.match(html,/data-p048-wrong-close="true" disabled=""/);
  s=act(s,'advance-feedback',{token:s.feedback!.token,frame:22});
  html=renderToStaticMarkup(<P048NativeV1 state={s} onEvent={()=>{}}/>);
  assert.doesNotMatch(html,/data-p048-wrong-close="true" disabled=""/);
});
test('help glossary is source Graph137; original source text and translated controls stay distinct',()=>{
  const s=act(quiz(),'open-nmh');assert.deepEqual(p048VisibleGlossary(s).map(x=>x.buttonId),[137]);
  const html=renderToStaticMarkup(<P048NativeV1 state={s} language="es" onEvent={()=>{}}/>);
  assert.match(html,/After the highest point, the efficiency is falling./);
  assert.match(html,/Cerrar/);assert.match(html,/lang="en"/);
});
