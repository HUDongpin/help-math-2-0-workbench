import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P020NativeTextV1,type P020NativeQuizSnapshotV1}
  from '../src/alg-l06-p020-native-text-v1';
import {P020_TEXT_STATE_SOURCE,p020TextState}
  from '../src/generated/alg-l06-p020-text-state-v1';

const ready:P020NativeQuizSnapshotV1={phase:'awaiting-answer',answersEnabled:true,
  feedbackKind:null,feedbackDomain:null,feedbackFrame:null,feedbackText:null};
const wrong:P020NativeQuizSnapshotV1={...ready,phase:'feedback',answersEnabled:false,
  feedbackKind:'wrong',feedbackDomain:65,feedbackFrame:23,
  feedbackText:'Find 5 in the input column. Then look across for its output value. Try again.',
  feedbackHoldFrame:23,feedbackAwaitingAcknowledgment:true,
  feedbackAckButtonCharacterId:60};
const render=(frame:number,quizState?:P020NativeQuizSnapshotV1,language:'en'|'es'='en')=>
  renderToStaticMarkup(<P020NativeTextV1 frame={frame} language={language}
    quizState={quizState} onGlossary={()=>{}} onAnswer={()=>{}} onAcknowledge={()=>{}}/>);
const buttons=(value:unknown):React.ReactElement[]=>{
  if(Array.isArray(value))return value.flatMap(buttons);
  if(!isValidElement(value))return [];
  return value.type==='button'?[value]:buttons((value.props as {children?:unknown}).children);
};

test('source-English companion shows table and full question at audited frames',()=>{
  assert.match(render(1,undefined,'es'),/data-p020-language-policy="source-en-fallback"/);
  assert.match(render(1),/data-p020-canvas-suppression="none"/);
  assert.doesNotMatch(render(1),/data-p020-question|data-p020-section="source-table"/);
  assert.match(render(2),/data-p020-section="source-table"/);
  assert.doesNotMatch(render(6),/data-p020-question/);
  assert.match(render(7).replace(/<[^>]+>/g,''),
    /If the input for this function is 5, what is the output\?/);
  assert.match(render(7),/data-source-rgba="0,0,204,255"/);
  assert.equal(p020TextState(58).table.rows.filter(row=>row.visible).length,4);
  assert.deepEqual(P020_TEXT_STATE_SOURCE.table.rows.map(row=>[row.inputText,row.outputText]),
    [['2','3'],['3','5'],['5','-2'],['7','1']]);
});

test('three exact glossary keys require own blue source run and full hit at frame 7',()=>{
  for(const [key,id] of [['Input',7],['Function',8],['Output',9]] as const){
    assert.doesNotMatch(render(6),new RegExp(`data-p020-glossary-key="${key}"`));
    assert.match(render(7),new RegExp(`data-p020-glossary-key="${key}"`));
    const control=P020_TEXT_STATE_SOURCE.glossaryControls.find(row=>row.key===key);
    assert(control);assert.equal(control.buttonId,id);
    assert.match(render(7),new RegExp(`data-source-button-instance-id="${control.sourceButtonInstanceId}"`));
  }
  const called:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P020NativeTextV1({frame:7,onGlossary:(key,button)=>called.push([key,button])}));
  assert.equal(nodes.length,3);
  const target=nodes.find(node=>(node.props as Record<string,unknown>)['data-p020-glossary-key']==='Function');
  assert(target);
  const trigger={focus(){}} as HTMLButtonElement;
  (target.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(called,[['Function',trigger]]);
});

test('four visual choices are source backed; buttons require held main 58 plus state',()=>{
  assert.doesNotMatch(render(57,ready),/<button[^>]*data-p020-option/);
  assert.doesNotMatch(render(58),/<button[^>]*data-p020-option/);
  assert.doesNotMatch(render(58,{...ready,answersEnabled:false}),/<button[^>]*data-p020-option/);
  const markup=render(58,ready);
  assert.match(markup,/<button[^>]*data-p020-option="B"[^>]*data-source-instance="AnsBtn2"/);
  assert.match(markup,/data-source-button-id="158"/);
  assert.match(markup,/B\. -2/);
  assert.match(render(59,ready),/data-p020-options="true"/);
  assert.doesNotMatch(render(59,ready),/<button[^>]*data-p020-option/);
  assert.match(markup,/grid-template-columns:repeat\(auto-fit, minmax\(min\(100%, 8\.5em\), 1fr\)\)/);
  const called:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P020NativeTextV1({frame:58,quizState:ready,
    onAnswer:(option,button)=>called.push([option,button])}));
  const choices=nodes.filter(node=>(node.props as Record<string,unknown>)['data-p020-option']);
  assert.equal(choices.length,4);
  const trigger={focus(){}} as HTMLButtonElement;
  (choices[1].props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(called,[['B',trigger]]);
});

test('source keeps only B minus two as noninteractive final answer through frame 172',()=>{
  const expected=[['A',[[7,59]]],['B',[[7,172]]],
    ['C',[[7,59]]],['D',[[7,59]]]];
  assert.deepEqual(P020_TEXT_STATE_SOURCE.options.map(row=>[row.option,row.visibleSpans]),expected);
  assert.equal(p020TextState(59).options.filter(row=>row.visible).length,4);
  for(const frame of [60,100,171,172]){
    assert.deepEqual(p020TextState(frame).options.filter(row=>row.visible).map(row=>[row.option,row.value]),
      [['B','-2']]);
    const markup=render(frame,ready);
    assert.match(markup,/aria-label="Answer shown"/);
    assert.match(markup,/data-p020-option="B"[^>]*data-source-label-text-id="23"[^>]*data-source-value-text-id="24"/);
    assert.match(markup,/B\. -2/);
    assert.doesNotMatch(markup,/data-p020-option="[ACD]"|<button[^>]*data-p020-option/);
  }
});

test('feedback titles wait for branch-local stable source ink; dynamic text waits for full popup alpha',()=>{
  for(const [domain,kind,titleFrame,title] of [
    [65,'wrong',16,'OH! NO'],[94,'wrong',6,'incorrect!'],[80,'wrong',9,'Try Again!'],
    [157,'right',12,'Correct!'],[128,'right',15,'Well done!'],
    [108,'right',15,'Excellent!'],[141,'right',12,'Great Job!']
  ] as const){
    const state={...wrong,feedbackDomain:domain,feedbackKind:kind,feedbackText:null};
    assert.doesNotMatch(render(58,{...state,feedbackFrame:titleFrame-1}),
      /data-p020-feedback-domain/);
    assert.match(render(58,{...state,feedbackFrame:titleFrame}),
      new RegExp(`data-p020-feedback-domain="${domain}"`));
    assert.match(render(58,{...state,feedbackFrame:titleFrame}),new RegExp(title.replace('!','\\!')));
  }
  for(const [domain,hold,button] of [[65,23,60],[94,20,89],[80,21,74]]){
    const state={...wrong,feedbackDomain:domain,feedbackFrame:hold-1,
      feedbackHoldFrame:hold,feedbackAckButtonCharacterId:button};
    assert.doesNotMatch(render(58,state),/data-p020-dynamic-feedback|data-p020-feedback-ack/);
    assert.match(render(58,{...state,feedbackFrame:hold}),/data-p020-dynamic-feedback="true"/);
    assert.match(render(58,{...state,feedbackFrame:hold}),/data-p020-feedback-ack="true"/);
    assert.doesNotMatch(render(58,{...state,feedbackFrame:hold+1}),
      /data-p020-dynamic-feedback|data-p020-feedback-ack/);
  }
  assert.doesNotMatch(render(58,{...wrong,feedbackText:'invented'}),/data-p020-dynamic-feedback/);
  assert.doesNotMatch(render(58,{...wrong,feedbackFrame:null}),/data-p020-feedback-domain/);
});

test('source Close callback is explicit and carries the physical button identity',()=>{
  const called:HTMLButtonElement[]=[];
  const nodes=buttons(P020NativeTextV1({frame:58,quizState:wrong,
    onAcknowledge:button=>called.push(button)}));
  const close=nodes.find(node=>(node.props as Record<string,unknown>)['data-p020-feedback-ack']==='true');
  assert(close);assert.equal((close.props as Record<string,unknown>)['data-source-button-id'],60);
  const trigger={focus(){}} as HTMLButtonElement;
  (close.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(called,[trigger]);
});

test('invalid frame and branch identities fail closed',()=>{
  assert.throws(()=>p020TextState(0),/P020_TEXT_FRAME_OUT_OF_RANGE/);
  assert.throws(()=>p020TextState(173),/P020_TEXT_FRAME_OUT_OF_RANGE/);
  assert.doesNotMatch(render(58,{...wrong,feedbackDomain:157}),/data-p020-feedback-domain/);
  assert.doesNotMatch(render(58,{...wrong,feedbackAckButtonCharacterId:74}),
    /data-p020-feedback-ack/);
});
