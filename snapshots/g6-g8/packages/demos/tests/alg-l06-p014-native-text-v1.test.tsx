import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P014NativeTextV1,type P014NativeQuizSnapshotV1}
  from '../src/alg-l06-p014-native-text-v1';

const ready:P014NativeQuizSnapshotV1={phase:'awaiting-answer',answersEnabled:true,
  feedbackKind:null,feedbackDomain:null,feedbackText:null};
const feedback:P014NativeQuizSnapshotV1={...ready,phase:'feedback',answersEnabled:false,
  feedbackKind:'wrong',feedbackDomain:28,feedbackFrame:20,
  feedbackText:'Substitute 25 for the variable C, which is the input for the formula to find the output, F. Try again.'};
const render=(frame:number,quizState?:P014NativeQuizSnapshotV1,language:'en'|'es'='en')=>
  renderToStaticMarkup(<P014NativeTextV1 frame={frame} quizState={quizState}
    language={language} onGlossary={()=>{}} onAnswer={()=>{}}/>);
const buttons=(value:unknown):React.ReactElement[]=>{
  if(Array.isArray(value))return value.flatMap(buttons);
  if(!isValidElement(value))return [];
  return value.type==='button'?[value]:buttons((value.props as {children?:unknown}).children);
};

test('reading companion retains source-English fallback and never spoils before source reveal',()=>{
  const initial=render(1,undefined,'es');
  assert.match(initial,/data-p014-language-policy="source-en-fallback"/);
  assert.match(initial,/data-p014-canvas-suppression="none"/);
  assert.doesNotMatch(initial,/data-p014-prompt|data-p014-option|data-p014-result/);
  assert.doesNotMatch(render(6),/data-p014-option|data-p014-glossary-key/);
  assert.match(render(7),/If the input for the formula shown/);
  assert.doesNotMatch(render(7),/<button[^>]*data-p014-option/);
  assert.doesNotMatch(render(10),/data-p014-formula/);
  assert.match(render(11),/F = \(9\/5\) × C \+ 32/);
  assert.doesNotMatch(render(108),/data-p014-diagram-labels/);
  assert.match(render(114),/data-p014-diagram-labels/);
  assert.doesNotMatch(render(424),/data-p014-result/);
  assert.match(render(425),/data-p014-result/);
});

test('answer buttons require held frame and quiz gate, then use exact visual option callback',()=>{
  assert.doesNotMatch(render(119,ready),/<button[^>]*data-p014-option/);
  assert.doesNotMatch(render(120,{...ready,answersEnabled:false}),
    /<button[^>]*data-p014-option/);
  assert.doesNotMatch(render(120,{...ready,phase:'feedback'}),
    /<button[^>]*data-p014-option/);
  const markup=render(120,ready);
  assert.match(markup,/data-source-instance="AnsBtn2"/);
  assert.match(markup,/<button[^>]*data-p014-option="D"/);
  const chosen:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P014NativeTextV1({frame:120,quizState:ready,
    onAnswer:(option,trigger)=>chosen.push([option,trigger])}));
  const answers=nodes.filter(node=>(node.props as {['data-p014-option']?:string})['data-p014-option']);
  assert.equal(answers.length,4);
  const trigger={focus(){}} as HTMLButtonElement;
  (answers[3].props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(chosen,[['D',trigger]]);
});

test('feedback is branch-state-only and dynamic text accepts exact source strings',()=>{
  assert.doesNotMatch(render(120),/data-p014-feedback-domain/);
  const wrong=render(120,feedback);
  assert.match(wrong,/data-p014-feedback-domain="28"/);
  assert.match(wrong,/incorrect!/);
  assert.match(wrong,/data-p014-dynamic-feedback="true"/);
  assert.doesNotMatch(render(120,{...feedback,feedbackText:'invented'}),
    /data-p014-dynamic-feedback/);
  assert.doesNotMatch(render(120,{...feedback,feedbackKind:'right',feedbackDomain:28}),
    /data-p014-feedback-domain/);
  assert.match(render(120,{...feedback,feedbackKind:'right',feedbackDomain:83,
    feedbackFrame:6,
    feedbackText:null}),/YOU GOT IT!/);
});

test('all seven source titles wait for local reveal and three dynamic hints wait for popup alpha',()=>{
  const titles:Array<[number,'right'|'wrong',number,string]>=
    [[28,'wrong',6,'incorrect!'],[173,'wrong',9,'OH! NO'],
      [187,'wrong',7,'Try Again!'],[83,'right',6,'YOU GOT IT!'],
      [115,'right',9,'Excellent!'],[148,'right',12,'Awesome!'],
      [156,'right',5,'Excellent!']];
  for(const [domain,kind,first,title] of titles){
    const branch={...feedback,feedbackDomain:domain,feedbackKind:kind};
    assert.doesNotMatch(render(120,{...branch,feedbackFrame:undefined}),
      /data-p014-feedback-domain/);
    assert.doesNotMatch(render(120,{...branch,feedbackFrame:first-1}),
      /data-p014-feedback-domain/);
    assert.match(render(120,{...branch,feedbackFrame:first}),
      new RegExp(`data-p014-feedback-domain="${domain}"`));
    assert.match(render(120,{...branch,feedbackFrame:first}),new RegExp(title.replace('!','\\!')));
  }
  for(const [domain,titleFrame,hintFrame] of [[28,6,20],[173,9,22],[187,7,23]]){
    const branch={...feedback,feedbackDomain:domain,feedbackFrame:titleFrame};
    assert.doesNotMatch(render(120,branch),/data-p014-dynamic-feedback/);
    assert.doesNotMatch(render(120,{...branch,feedbackFrame:hintFrame-1}),
      /data-p014-dynamic-feedback/);
    assert.match(render(120,{...branch,feedbackFrame:hintFrame}),
      /data-p014-dynamic-feedback="true"/);
  }
});

test('source Close control appears only at the fully visible wrong-feedback hold',()=>{
  const held={...feedback,feedbackFrame:20,feedbackHoldFrame:20,
    feedbackAwaitingAcknowledgment:true,feedbackAckButtonCharacterId:21};
  assert.doesNotMatch(render(120,feedback),/data-p014-feedback-ack/);
  assert.doesNotMatch(render(120,{...held,feedbackFrame:19}),/data-p014-feedback-ack/);
  assert.doesNotMatch(render(120,{...held,feedbackAckButtonCharacterId:167}),
    /data-p014-feedback-ack/);
  assert.match(render(120,held),/data-p014-feedback-ack="true"/);
  assert.match(render(120,held),/>Close<\/button>/);
  const acknowledged:HTMLButtonElement[]=[];
  const elements=buttons(P014NativeTextV1({frame:120,quizState:held,
    onAcknowledge:trigger=>acknowledged.push(trigger)}));
  const close=elements.find(element=>(element.props as {['data-p014-feedback-ack']?:string})
    ['data-p014-feedback-ack']==='true');
  assert(close);
  const trigger={focus(){}} as HTMLButtonElement;
  (close.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(acknowledged,[trigger]);
});

test('native companion advances source math, input and resolved output without stale answer question',()=>{
  assert.match(render(253),/data-p014-formula-stage="general"/);
  assert.match(render(253),/F = \(9\/5\) × C \+ 32/);
  assert.match(render(254),/data-p014-formula-stage="substitution"/);
  assert.match(render(254),/F = \(9\/5\) × 25 \+ 32/);
  assert.match(render(310),/F = \(9\/5\) × 25 \+ 32/);
  assert.match(render(311),/data-p014-formula-stage="intermediate"/);
  assert.match(render(311),/F = 45 \+ 32/);
  assert.doesNotMatch(render(187),/data-p014-input-value/);
  assert.match(render(188),/data-p014-input-value="true"[^>]*>25°C<\/span>/);
  assert.match(render(424),/data-p014-output-value="true"[^>]*>\?<\/span>/);
  const terminal=render(449);
  assert.match(terminal,/F = 45 \+ 32<span data-p014-result="true"/);
  assert.match(terminal,/data-p014-output-value="true"[^>]*>77°F<\/span>/);
  assert.doesNotMatch(terminal,/data-source-text-ids="character-210"|>\?<\/span>/);
  assert.doesNotMatch(terminal,/aria-label="F equals nine fifths times C plus 32"/);
});

test('answer grid caps its minimum column width to the available section width',()=>{
  assert.match(render(120,ready),
    /grid-template-columns:repeat\(auto-fit, minmax\(min\(100%, 8\.5em\), 1fr\)\)/);
});
