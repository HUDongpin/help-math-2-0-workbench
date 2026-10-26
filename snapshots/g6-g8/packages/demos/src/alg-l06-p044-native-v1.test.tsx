import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import bindings from '../../../migrations/shared-alg001-l06-p044/native-v1/native-bindings-v1.json';
import {initialP044State,reduceP044,type P044State,type P044Event}
  from './alg-l06-p044-state-v1';
import {P044NativeV1,p044NativeOptions,p044NativeWrong4,p044NativeGlossary}
  from './alg-l06-p044-native-v1';

function apply(state:P044State,type:string,fields:Partial<P044Event>={}){
  const next=reduceP044(state,{type,epoch:state.epoch,...fields});
  assert.equal(next.accepted,true,next.reason);return next.state;
}
function quiz(){return apply(apply(initialP044State(),'start-main'),
  'advance-main',{frame:53});}

test('source-bound answer controls are in source order and only at quiz hold',()=>{
  assert.equal(bindings.source.physicalSwfSha256,
    '50952b58f10d24b5d649930817aff9f6b779ebb1f698f14392eda00d8afdec34');
  assert.equal(bindings.quizFrame,53);
  assert.deepEqual(p044NativeOptions(initialP044State()),[]);
  const options=p044NativeOptions(quiz());
  assert.deepEqual(options.map(o=>[o.choice,o.buttonId,o.branch]),[
    ['A',161,'wrong4'],['B',162,'right4'],
    ['C',161,'wrong4'],['D',161,'wrong4']]);
  assert.deepEqual(options.map(o=>o.sourceValue),[
    '{(0, –1), (0, 0), (0, 1)}',
    '{(5, 1), (10, 1), (15, 1)}',
    '{(2, –2), (2, 0), (–2, 0)}',
    '{(–5, –4), (–4, –3), (–5, –1)}']);
  const html=renderToStaticMarkup(<P044NativeV1 state={quiz()} language="es"/>);
  assert.match(html,/data-source-question-text-id="147"/);
  assert.match(html,/Texto original en inglés/);
  assert.match(html,/data-source-choice="B"/);
  assert.match(html,/data-source-button-id="143"/);
  assert.match(html,/data-p044-overlay-calibration="pending"/);
});

test('NMH and wrong4 expose only reachable native text and Close',()=>{
  const atHold=quiz();
  const nmh=apply(atHold,'open-nmh',{quizGeneration:atHold.quizGeneration});
  assert.deepEqual(p044NativeGlossary(nmh).map(o=>o.buttonId),[137,138,139,140,141]);
  const nmhHtml=renderToStaticMarkup(<P044NativeV1 state={nmh}/>);
  for(const id of [133,134,135])assert.match(nmhHtml,
    new RegExp(`data-source-nmh-text-id="${id}"`));
  assert.match(nmhHtml,/data-source-button-id="172"/);
  const chosen=apply(atHold,'choose',{choice:'A',quizGeneration:atHold.quizGeneration});
  assert.equal(p044NativeWrong4(chosen),null);
  const held=apply(chosen,'advance-feedback',
    {token:chosen.feedback!.token,frame:20});
  const wrong=p044NativeWrong4(held);
  assert.equal(wrong?.spriteId,336);
  assert.equal(wrong?.popupSpriteId,333);
  assert.equal(wrong?.editTextId,332);
  assert.equal(wrong?.canClose,true);
  const wrongHtml=renderToStaticMarkup(<P044NativeV1 state={held}/>);
  assert.match(wrongHtml,/All the x-coordinates must be different in a function/);
  assert.match(wrongHtml,/data-source-button-id="331"/);
});
