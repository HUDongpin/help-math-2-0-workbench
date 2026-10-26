import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialP045State, reduceP045, type P045State, type P045Event} from './alg-l06-p045-state-v1';
import {P045NativeV1, P045GraphHitTargetsV1, p045NativeOptions, p045NativeWrong4, p045NativeGlossary} from './alg-l06-p045-native-v1';

function step(state:P045State, type:string, fields:Partial<P045Event>={}) {
  const result=reduceP045(state,{type,epoch:state.epoch,...fields});
  assert(result.accepted,result.reason);return result.state;
}
function quiz(){return step(step(initialP045State(),'start-main'),'advance-main',{frame:53});}

test('graph letters, internal instance names and source hit boxes remain distinct',()=>{
  const state=quiz(), options=p045NativeOptions(state);
  assert.deepEqual(options.map(o=>[o.choice,o.instance,o.letterTextId,o.branch]),[
    ['A','AnsBtn1',52,'wrong4'],['B','AnsBtn3',37,'wrong4'],
    ['C','AnsBtn2',60,'right4'],['D','AnsBtn4',49,'wrong4']]);
  assert(options[0].hitBoxPx[2]<options[1].hitBoxPx[0]);
  assert(options[0].hitBoxPx[3]<options[2].hitBoxPx[1]);
  const html=renderToStaticMarkup(<P045GraphHitTargetsV1 state={state} onChoose={()=>{}}/>);
  assert.equal((html.match(/data-source-choice=/g)||[]).length,4);
  assert.match(html,/Choose graph C, lower left/);
  assert.match(html,/data-source-instance="AnsBtn2"/);
  assert.equal(p045NativeOptions(initialP045State()).length,0);
  const chosen=step(state,'choose',{choice:'C',quizGeneration:state.quizGeneration});
  assert.equal(p045NativeOptions(chosen).length,0);
});

test('native help, glossary and feedback follow source popup visibility frames',()=>{
  const state=quiz();
  const nmh=step(state,'open-nmh',{quizGeneration:state.quizGeneration});
  assert.deepEqual(p045NativeGlossary(nmh).map(x=>x.buttonId),[138,139,140,141,142,143]);
  const html=renderToStaticMarkup(<P045NativeV1 state={nmh} language="es"/>);
  assert.match(html,/Vertical-line test/);
  assert.match(html,/data-source-button-id="188"/);
  const chosen=step(state,'choose',{choice:'B',quizGeneration:state.quizGeneration});
  const token=chosen.feedback!.token;
  const before=step(chosen,'advance-feedback',{frame:15,token});
  assert.equal(p045NativeWrong4(before),null);
  const shown=step(before,'advance-feedback',{frame:16,token});
  assert.equal(p045NativeWrong4(shown)?.canClose,false);
  const held=step(shown,'advance-feedback',{frame:22,token});
  const popup=p045NativeWrong4(held);
  assert.equal(popup?.editTextId,302);
  assert.equal(popup?.closeButtonId,300);
  assert.equal(popup?.canClose,true);
  assert.equal(popup?.text,'Use the vertical-line test. Try again.');
});
