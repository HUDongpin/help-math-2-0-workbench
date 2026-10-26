import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P020PlayerV1,p020ChooseFeedbackBranch,p020PaintVerifiedFrame,
  p020CanOpenGlossary,p020CanAnswer,p020CanAcknowledge,
  p020HandoffFocus,p020ReturnFocusSelector,p020CloseGlossarySnapshot,
  type P020CanvasAssetV1} from '../src/alg-l06-p020-player-v1';
import {AlgL06P020QuizStateV1} from '../src/alg-l06-p020-state-v1';
import {P020NativeTextV1} from '../src/alg-l06-p020-native-text-v1';
import {P020_TIMELINE} from '../src/alg-l06-p020-timeline-v1';

function fixture(){
  const attrs=new Map<string,string>();
  const canvas={width:800,height:600,getAttribute:(key:string)=>attrs.get(key)??null,
    setAttribute:(key:string,value:string)=>{attrs.set(key,value);},
    removeAttribute:(key:string)=>{attrs.delete(key);}} as unknown as HTMLCanvasElement;
  const requests:{frame:number;feedback?:{domain:string;frame:number};lang:string}[]=[];
  const asset:P020CanvasAssetV1={
    metadata:{animationId:P020_TIMELINE.animationId,sourceSwfSha256:P020_TIMELINE.sourceSwfSha256,
      stage:P020_TIMELINE.stage,fps:12,
      deterministicContentTimeline:{timelineId:'sprite-162',frameCount:172}},
    ready:async()=>undefined,
    render:(target,request)=>{
      assert.equal(target,canvas);requests.push(request);
      target.setAttribute('data-flash-frame',String(request.frame));
      target.setAttribute('data-flash-frame-domain','sprite-162');
      if(request.feedback){target.setAttribute('data-feedback-domain',request.feedback.domain);
        target.setAttribute('data-feedback-frame',String(request.feedback.frame));}
      else {target.removeAttribute('data-feedback-domain');target.removeAttribute('data-feedback-frame');}
      return {localFrame:request.frame,frameDomain:'sprite-162',rootFrame:6,
        feedbackDomain:request.feedback?.domain??null,feedbackFrame:request.feedback?.frame??null};
    },
  };
  return {canvas,asset,requests};
}

test('source Canvas commits held quiz and exact nested feedback frame atomically',()=>{
  const f=fixture(),state=new AlgL06P020QuizStateV1();
  p020PaintVerifiedFrame(f.asset,f.canvas,state.snapshot());
  state.play();state.advanceMain(58);
  p020PaintVerifiedFrame(f.asset,f.canvas,state.snapshot());
  state.answer('AnsBtn1',1);state.advanceFeedback(23,state.snapshot().feedbackToken!);
  p020PaintVerifiedFrame(f.asset,f.canvas,state.snapshot());
  assert.deepEqual(f.requests.map(r=>[r.frame,r.feedback?.domain??null,r.feedback?.frame??null]),
    [[1,null,null],[58,null,null],[58,'sprite-65',23]]);
  assert(f.requests.every(r=>r.lang==='en'));
  state.acknowledgeFeedback(state.snapshot().feedbackToken!);
  state.advanceFeedback(28,state.snapshot().feedbackToken!);state.completeFeedback(state.snapshot().feedbackToken!,28);
  p020PaintVerifiedFrame(f.asset,f.canvas,state.snapshot());
  assert.equal(f.canvas.getAttribute('data-feedback-domain'),null);
});

test('wrong asset identity or parent drift rejects branch drawing',()=>{
  const f=fixture(),state=new AlgL06P020QuizStateV1();
  const wrong={...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'different'}};
  assert.throws(()=>p020PaintVerifiedFrame(wrong,f.canvas,state.snapshot()),
    /P020_CANVAS_ASSET_IDENTITY_MISMATCH/u);
  const invalid={...state.snapshot(),mainFrame:59,feedbackDomain:'sprite-65' as const,
    feedbackFrame:23};
  assert.throws(()=>p020PaintVerifiedFrame(f.asset,f.canvas,invalid),
    /P020_FEEDBACK_PARENT_NOT_HELD/u);
});

test('conditional chooser injection covers all four right and three wrong domains',()=>{
  for(const [kind,limit] of [['right',4],['wrong',3]] as const){
    for(let i=1;i<=limit;i++)assert.equal(p020ChooseFeedbackBranch(kind,0,()=>i),i);
    assert.throws(()=>p020ChooseFeedbackBranch(kind,0,()=>limit+1),
      /P020_INVALID_FEEDBACK_BRANCH/u);
  }
});

test('focus handoff follows the focused source trigger and respects later focus moves',()=>{
  const body={},document={body,activeElement:null as unknown};
  const section={isConnected:true,tagName:'SECTION',tabIndex:0,hasAttribute:()=>false,
    focus:()=>{document.activeElement=section;}};
  const answer={isConnected:true,tagName:'BUTTON',hasAttribute:()=>false,
    focus:()=>{document.activeElement=answer;}};
  const trigger={ownerDocument:document};
  const scope={querySelector:(selector:string)=>selector.includes('option')?answer:section};
  const handoff=(hadFocus:boolean,selector:string)=>p020HandoffFocus(
    trigger as unknown as HTMLButtonElement,hadFocus,
    scope as unknown as HTMLElement,selector);
  document.activeElement=trigger;
  assert.equal(handoff(false,'[data-p020-option="A"]'),false);
  assert.equal(document.activeElement,trigger);
  document.activeElement=body; // React removed the focused source button.
  assert.equal(handoff(true,'[data-p020-native-text="true"]'),true);
  assert.equal(document.activeElement,section);
  assert.equal(section.tabIndex,-1);
  document.activeElement=body;
  assert.equal(handoff(true,'[data-p020-option="A"]'),true);
  assert.equal(document.activeElement,answer);
  document.activeElement=answer; // The student tabbed away while SA Return awaited retirement.
  assert.equal(handoff(true,'[data-p020-native-text="true"]'),false);
  assert.equal(document.activeElement,answer);
});

test('Return focus picks active quiz answer or source Close, otherwise stable companion',()=>{
  const state=new AlgL06P020QuizStateV1();
  assert.equal(p020ReturnFocusSelector(state.snapshot(),null),
    '[data-p020-native-text="true"]');
  state.play();state.advanceMain(58);
  assert.equal(p020ReturnFocusSelector(state.snapshot(),null),'[data-p020-option="A"]');
  state.answer('AnsBtn1',1);
  assert.equal(p020ReturnFocusSelector(state.snapshot(),'A'),
    '[data-p020-native-text="true"]');
  state.advanceFeedback(23,state.snapshot().feedbackToken!);
  assert.equal(p020ReturnFocusSelector(state.snapshot(),'A'),
    '[data-p020-feedback-ack="true"]');
  state.acknowledgeFeedback(state.snapshot().feedbackToken!);
  assert.equal(p020ReturnFocusSelector(state.snapshot(),'A'),
    '[data-p020-native-text="true"]');
});

test('closing glossary publishes the released held-quiz state without resuming playback',()=>{
  const state=new AlgL06P020QuizStateV1();
  state.play();state.advanceMain(58);
  state.openGlossary('Input');
  assert.equal(state.snapshot().answersEnabled,false);
  const refreshed=p020CloseGlossarySnapshot(state,()=>state.snapshot());
  assert.equal(refreshed.glossaryOpen,null);
  assert.equal(refreshed.mainFrame,58);
  assert.equal(refreshed.phase,'awaiting-answer');
  assert.equal(refreshed.answersEnabled,true);
  assert.equal(refreshed.playing,false);
});

test('Spanish UI and reduced motion never start SA or eight domain assets during markup',()=>{
  const f=fixture();let mainLoads=0,saLoads=0;
  const html=renderToStaticMarkup(<P020PlayerV1 asset={f.asset}
    loadAudio={async()=>{mainLoads++;return new ArrayBuffer(0);}}
    loadSpanishAudio={async()=>{saLoads++;return new ArrayBuffer(0);}}
    language="es" reducedMotion onOpenGlossary={()=>{}}/>);
  assert.equal(mainLoads,0);assert.equal(saLoads,0);
  assert.match(html,/data-p020-player-phase="loading"/u);
  assert.match(html,/data-p020-audio-owner="main"/u);
  assert.match(html,/data-p020-sa-phase="idle"/u);
  assert.match(html,/data-p020-motion-policy="explicit-reduced"/u);
  assert.match(html,/Audio en español/u);
  assert.match(html,/<canvas[^>]*aria-hidden="true"/u);
});

function sourceButton(attrs:Record<string,string>){
 const values=new Map(Object.entries(attrs));
 const button={isConnected:true,disabled:false,getAttribute:(k:string)=>values.get(k)??null} as unknown as HTMLButtonElement;
 return {button,values};
}
test('exact glossary source identity and visible frame gate reject early or stale actions',()=>{
 const state=new AlgL06P020QuizStateV1();state.play();state.advanceMain(7);
 for(const key of ['Input','Function','Output'] as const){
  const source=P020_TIMELINE.glossary[key];
  const f=sourceButton({'data-source-button-id':String(source.characterId),
   'data-source-action-sha256':source.actionSha256,'data-source-button-instance-id':source.instanceId,
   'data-source-label-text-id':String(source.labelTextId)});
  assert(p020CanOpenGlossary(key,f.button,state.snapshot()));
  assert(!p020CanOpenGlossary(key,f.button,{...state.snapshot(),mainFrame:6}));
  assert(!p020CanOpenGlossary(key,f.button,{...state.snapshot(),phase:'feedback'}));
  for(const [attr,value] of [...f.values]){f.values.set(attr,'wrong');
   assert(!p020CanOpenGlossary(key,f.button,state.snapshot()));f.values.set(attr,value);}
 }
});
test('A/B/C/D source handlers accept only held quiz and matching native attributes',()=>{
 const state=new AlgL06P020QuizStateV1();state.play();state.advanceMain(58);
 for(const option of ['A','B','C','D'] as const){
  const source=P020_TIMELINE.answers[option];
  const f=sourceButton({'data-p020-option':option,'data-source-instance':source.sourceInstance,
   'data-source-button-id':String(source.characterId),'data-source-action-sha256':source.actionSha256});
  assert(p020CanAnswer(option,f.button,state.snapshot()));
  for(const [attr,value] of [...f.values]){f.values.set(attr,'wrong');
   assert(!p020CanAnswer(option,f.button,state.snapshot()));f.values.set(attr,value);}
  assert(!p020CanAnswer(option,f.button,{...state.snapshot(),mainFrame:59}));
  assert(!p020CanAnswer(option,f.button,{...state.snapshot(),answersEnabled:false}));
 }
 assert.equal(P020_TIMELINE.answers.B.sourceInstance,'AnsBtn2');
 assert.equal(P020_TIMELINE.answers.B.characterId,158);
});
test('wrong popup Close accepts only the active held source branch',()=>{
 const holds=[23,20,21],ids=[60,89,74];
 for(let branch=1;branch<=3;branch++){
  const state=new AlgL06P020QuizStateV1();state.play();state.advanceMain(58);state.answer('AnsBtn1',branch);
  const f=sourceButton({'data-p020-feedback-ack':'true','data-source-button-id':String(ids[branch-1]),
   'data-source-action-sha256':P020_TIMELINE.acknowledgmentActions[ids[branch-1] as 60|89|74]});
  assert(!p020CanAcknowledge(f.button,state.snapshot()));
  state.advanceFeedback(holds[branch-1],state.snapshot().feedbackToken!);
  assert(p020CanAcknowledge(f.button,state.snapshot()));
  f.values.set('data-source-action-sha256','wrong');assert(!p020CanAcknowledge(f.button,state.snapshot()));
  f.values.set('data-source-action-sha256',P020_TIMELINE.acknowledgmentActions[ids[branch-1] as 60|89|74]);
  f.values.set('data-source-button-id','999');assert(!p020CanAcknowledge(f.button,state.snapshot()));
  state.replay();assert(!p020CanAcknowledge(f.button,state.snapshot()));
 }
});

function renderedButtons(html:string){
 return [...html.matchAll(/<button\b[^>]*>/gu)].map(([tag])=>{
  const attrs=Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/gu)].map(([,k,v])=>[k,v]));
  const f=sourceButton(attrs);if('disabled' in attrs)Object.assign(f.button,{disabled:true});
  return {attrs,...f};
 });
}
test('all172 native frame gates agree with player source checks; source English retained under ES',()=>{
 for(let frame=1;frame<=172;frame++){
  const state=new AlgL06P020QuizStateV1();
  const quiz={...state.snapshot(),mainFrame:frame};
  const html=renderToStaticMarkup(<P020NativeTextV1 frame={frame} language="es"
   onGlossary={()=>{}}/>);
  assert.match(html,/lang="en"/);
  const controls=renderedButtons(html).filter(b=>b.attrs['data-p020-glossary-key']);
  assert.equal(controls.length,frame>=7?3:0,`frame${frame}`);
  for(const control of controls)assert(p020CanOpenGlossary(
   control.attrs['data-p020-glossary-key'] as keyof typeof P020_TIMELINE.glossary,
   control.button,quiz),`frame${frame}`);
 }
});
test('held native answer and all wrong Close controls bind actual player gates',()=>{
 const state=new AlgL06P020QuizStateV1();state.play();state.advanceMain(58);
 const native=()=>({...state.snapshot(),feedbackDomain:state.snapshot().feedbackDomain===null?
  null:Number(state.snapshot().feedbackDomain!.slice(7))});
 const html=renderToStaticMarkup(<P020NativeTextV1 frame={58} quizState={native()} onAnswer={()=>{}}/>);
 const controls=renderedButtons(html).filter(b=>b.attrs['data-p020-option']);
 assert.equal(controls.length,4);
 for(const c of controls)assert(p020CanAnswer(c.attrs['data-p020-option'] as 'A'|'B'|'C'|'D',c.button,state.snapshot()));
 for(let branch=1;branch<=3;branch++){
  state.replay();state.play();state.advanceMain(58);state.answer('AnsBtn1',branch);
  state.advanceFeedback(state.snapshot().feedbackHoldFrame!,state.snapshot().feedbackToken!);
  const output=renderToStaticMarkup(<P020NativeTextV1 frame={58} quizState={native()} onAcknowledge={()=>{}}/>);
  const ack=renderedButtons(output).filter(b=>b.attrs['data-p020-feedback-ack']);
  assert.equal(ack.length,1,`branch${branch}`);assert(p020CanAcknowledge(ack[0].button,state.snapshot()));
  assert.match(output,/Find 5 in the input column/);
 }
});
