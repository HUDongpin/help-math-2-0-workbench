import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {p035CanActivate,p035InteractionState,P035NativeInteractionDraft,
  type P035InteractionOwner,type P035InteractionControl}
 from './alg-l06-p035-native-interaction-v1';

const base=():P035InteractionOwner=>({mainFrame:145,mainAudioToken:Symbol('main'),
  feedbackEpoch:2,spanishEpoch:4,interactionEpoch:6,feedback:null,
  inputLocked:false,glossaryOpen:false,spanishSelected:false,
  canChoose:true,canOpenGlossary:true,canCloseFeedback:true});

test('physical quiz at 145: four exact controls, B 51 right, other values wrong',()=>{
  const owner=base(),s=p035InteractionState(owner);
  assert.deepEqual(s.choices.map(x=>[x.key,x.buttonId,x.value,x.sourceHandler]),[
    ['AnsBtn1',54,'50','wrong'],['AnsBtn2',55,'51','right'],
    ['AnsBtn3',54,'225','wrong'],['AnsBtn4',54,'226','wrong']]);
  assert.equal(p035InteractionState({...owner,mainFrame:144}).choices.length,0);
  assert.equal(p035InteractionState({...owner,mainFrame:146}).choices.length,0);
  assert.equal(p035InteractionState({...owner,inputLocked:true}).choices.length,0);
});

test('each glossary key waits for its own fully revealed blue source label',()=>{
  const owner=base();
  const ready:[string,number][]=[['Substitute',23],['Equation',62],
    ['Function',76],['Output',109],['Input',127]];
  for(const [key,frame] of ready){
    assert(!p035InteractionState({...owner,mainFrame:frame-1}).glossary.some(x=>x.key===key));
    const control=p035InteractionState({...owner,mainFrame:frame}).glossary.find(x=>x.key===key);
    assert(control);assert.match(control.actionSha256,/^[a-f0-9]{64}$/u);
    assert(control.labelInstanceId.includes('/227/depth-'));
  }
  assert.deepEqual(p035InteractionState({...owner,mainFrame:145}).glossary.map(x=>x.key),
    ready.map(x=>x[0]));
  assert.equal(p035InteractionState({...owner,glossaryOpen:true}).glossary.length,0);
  assert.equal(p035InteractionState({...owner,spanishSelected:true}).glossary.length,0);
});

test('Close belongs only to the selected feedback branch and finite local-frame window',()=>{
  const owner=base();
  for(const [id,first,last,destination] of [[80,14,20,21],[95,15,21,22],[126,16,22,23]]){
    const at=(frame:number)=>p035InteractionState({...owner,
      feedback:{spriteId:id,frame},wrongTryCount:0});
    assert.equal(at(first-1).close.length,0);
    assert.equal(at(first).close.length,1);
    assert.equal(at(last).close[0].destinationFrame,destination);
    assert.equal(at(last+1).close.length,0);
    assert.equal(at(first).choices.length,0);
    assert.equal(at(first).glossary.length,0);
  }
  assert.equal(p035InteractionState({...owner,
    feedback:{spriteId:179,frame:16}}).close.length,0);
});

function fakeDom(control:P035InteractionControl,owner:P035InteractionOwner){
  const attrs=new Map<string,string>([
    ['data-p035-kind',control.kind],['data-p035-key',control.key],
    ['data-source-button-id',String(control.buttonId)],
    ['data-source-button-instance-id',control.buttonInstanceId],
    ['data-source-action-sha256',control.actionSha256],
    ['data-source-label-instance-id',control.labelInstanceId],
    ['data-source-label-text-id',String(control.labelTextId)],
    ['data-p035-main-frame',String(control.sourceFrame)],
    ['data-p035-feedback-sprite-id',String(control.feedbackSpriteId??'')],
    ['data-p035-feedback-frame',String(control.feedbackFrame??'')],
  ]);
  const scope={isConnected:true,
    getAttribute:(key:string)=>key==='data-p035-interaction'?'source-only':
      key==='data-p035-main-frame'?String(owner.mainFrame):null,
    contains:(x:unknown)=>x===trigger} as unknown as HTMLElement;
  const trigger={isConnected:true,disabled:false,
    getAttribute:(key:string)=>attrs.get(key)??null,
    closest:()=>scope} as unknown as HTMLButtonElement;
  return {scope,trigger,attrs};
}

test('live activation checks instance/DOM and all independent owner clocks',()=>{
  const owner=base();
  const row=p035InteractionState(owner).choices[1];assert(row);
  const {scope,trigger,attrs}=fakeDom(row,owner);
  const can=(current:P035InteractionOwner|null)=>
    p035CanActivate(row,trigger,scope,owner,()=>current);
  assert(can(owner));
  assert(!can({...owner,mainAudioToken:Symbol('next main')}));
  assert(!can({...owner,feedbackEpoch:3}));
  assert(!can({...owner,spanishEpoch:5}));
  assert(!can({...owner,interactionEpoch:7}));
  assert(!can({...owner,mainFrame:146}));
  assert(!can({...owner,feedback:{spriteId:80,frame:14},wrongTryCount:0}));
  assert(!can({...owner,inputLocked:true}));
  assert(!can(null));
  attrs.set('data-source-button-instance-id','foreign');assert(!can(owner));
  attrs.set('data-source-button-instance-id',row.buttonInstanceId);
  (trigger as {disabled:boolean}).disabled=true;assert(!can(owner));
  (trigger as {disabled:boolean}).disabled=false;
  (scope as {isConnected:boolean}).isConnected=false;assert(!can(owner));
});

test('glossary and Close activation reject masked, stale, foreign, and right-179 controls',()=>{
  const owner=base();
  const glossary=p035InteractionState({...owner,mainFrame:23}).glossary[0];assert(glossary);
  const gOwner={...owner,mainFrame:23};
  const g=fakeDom(glossary,gOwner);
  assert(p035CanActivate(glossary,g.trigger,g.scope,gOwner,()=>gOwner));
  assert(!p035CanActivate(glossary,g.trigger,g.scope,gOwner,()=>
    ({...gOwner,mainFrame:22})));
  assert(!p035CanActivate(glossary,g.trigger,g.scope,gOwner,()=>
    ({...gOwner,glossaryOpen:true})));
  g.attrs.set('data-source-label-instance-id','other generation');
  assert(!p035CanActivate(glossary,g.trigger,g.scope,gOwner,()=>gOwner));
  const fOwner={...owner,feedback:{spriteId:80,frame:14},wrongTryCount:0 as const};
  const close=p035InteractionState(fOwner).close[0];assert(close);
  const f=fakeDom(close,fOwner);
  assert(p035CanActivate(close,f.trigger,f.scope,fOwner,()=>fOwner));
  assert(!p035CanActivate(close,f.trigger,f.scope,fOwner,()=>
    ({...fOwner,feedback:{spriteId:80,frame:21}})));
  assert(!p035CanActivate(close,f.trigger,f.scope,fOwner,()=>
    ({...fOwner,feedback:{spriteId:179,frame:14},wrongTryCount:undefined})));
  assert.throws(()=>p035InteractionState({...fOwner,
    feedback:{spriteId:179,frame:14}}),/P035_WRONG_TRY_FEEDBACK_DOMAIN/u);
});

test('render uses native buttons for pointer and Enter/Space; callbacks remain owner supplied',()=>{
  const owner=base();
  const html=renderToStaticMarkup(<P035NativeInteractionDraft owner={owner}
    readCurrentOwner={()=>owner} onChoose={()=>{}} onOpenGlossary={()=>{}}
    onCloseFeedback={()=>{}} language="es"/>);
  assert.match(html,/data-p035-interaction="source-only"/u);
  assert.match(html,/data-p035-language-policy="source-en-fallback"/u);
  assert.match(html,/data-p035-focus-policy="owner-restores-after-feedback-or-glossary"/u);
  assert.match(html,/type="button"/u);
  // These controls may be portaled outside [data-p035-player]; sizing must travel with them.
  assert.match(html,/style="[^"]*min-height:44px;[^"]*width:100%;[^"]*font:inherit/u);
  assert.match(html,/B\. 51/u);
  assert.match(html,/Substitute glossary/u);
  assert(!html.includes('onkeydown'));
  assert(!html.includes('disabled=""'));
  const noCallback=renderToStaticMarkup(<P035NativeInteractionDraft owner={owner}
    readCurrentOwner={()=>owner}/>);
  assert.match(noCallback,/disabled=""/u);
});
