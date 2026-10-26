import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P014PlayerV1,p014ChooseFeedbackBranch,p014PaintVerifiedFrame,
  p014HandoffFocus,p014ReturnFocusSelector,p014CloseGlossarySnapshot,
  type P014CanvasAssetV1} from '../src/alg-l06-p014-player-v1';
import {AlgL06P014QuizStateV1} from '../src/alg-l06-p014-state-v1';
import {P014_TIMELINE} from '../src/alg-l06-p014-timeline-v1';

function fixture(){
  const attrs=new Map<string,string>();
  const canvas={width:800,height:600,getAttribute:(key:string)=>attrs.get(key)??null,
    setAttribute:(key:string,value:string)=>{attrs.set(key,value);},
    removeAttribute:(key:string)=>{attrs.delete(key);}} as unknown as HTMLCanvasElement;
  const requests:{frame:number;feedback?:{domain:string;frame:number};lang:string}[]=[];
  const asset:P014CanvasAssetV1={
    metadata:{animationId:P014_TIMELINE.animationId,sourceSwfSha256:P014_TIMELINE.sourceSwfSha256,
      stage:P014_TIMELINE.stage,fps:12,
      deterministicContentTimeline:{timelineId:'sprite-227',frameCount:449}},
    ready:async()=>undefined,
    render:(target,request)=>{
      assert.equal(target,canvas);requests.push(request);
      target.setAttribute('data-flash-frame',String(request.frame));
      target.setAttribute('data-flash-frame-domain','sprite-227');
      if(request.feedback){target.setAttribute('data-feedback-domain',request.feedback.domain);
        target.setAttribute('data-feedback-frame',String(request.feedback.frame));}
      else {target.removeAttribute('data-feedback-domain');target.removeAttribute('data-feedback-frame');}
      return {localFrame:request.frame,frameDomain:'sprite-227',rootFrame:6,
        feedbackDomain:request.feedback?.domain??null,feedbackFrame:request.feedback?.frame??null};
    },
  };
  return {canvas,asset,requests};
}

test('source Canvas commits held quiz and exact nested feedback frame atomically',()=>{
  const f=fixture(),state=new AlgL06P014QuizStateV1();
  p014PaintVerifiedFrame(f.asset,f.canvas,state.snapshot());
  state.play();state.advanceMain(120);
  p014PaintVerifiedFrame(f.asset,f.canvas,state.snapshot());
  state.answer('AnsBtn1',1);state.advanceFeedback(22);
  p014PaintVerifiedFrame(f.asset,f.canvas,state.snapshot());
  assert.deepEqual(f.requests.map(r=>[r.frame,r.feedback?.domain??null,r.feedback?.frame??null]),
    [[1,null,null],[120,null,null],[120,'sprite-173',22]]);
  assert(f.requests.every(r=>r.lang==='en'));
  state.acknowledgeFeedback(state.snapshot().feedbackToken!);
  state.advanceFeedback(31);state.completeFeedback(state.snapshot().feedbackToken!,31);
  p014PaintVerifiedFrame(f.asset,f.canvas,state.snapshot());
  assert.equal(f.canvas.getAttribute('data-feedback-domain'),null);
});

test('wrong asset identity or parent drift rejects branch drawing',()=>{
  const f=fixture(),state=new AlgL06P014QuizStateV1();
  const wrong={...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'different'}};
  assert.throws(()=>p014PaintVerifiedFrame(wrong,f.canvas,state.snapshot()),
    /P014_CANVAS_ASSET_IDENTITY_MISMATCH/u);
  const invalid={...state.snapshot(),mainFrame:121,feedbackDomain:'sprite-173' as const,
    feedbackFrame:22};
  assert.throws(()=>p014PaintVerifiedFrame(f.asset,f.canvas,invalid),
    /P014_FEEDBACK_PARENT_NOT_HELD/u);
});

test('conditional chooser injection covers all four right and three wrong domains',()=>{
  for(const [kind,limit] of [['right',4],['wrong',3]] as const){
    for(let i=1;i<=limit;i++)assert.equal(p014ChooseFeedbackBranch(kind,0,()=>i),i);
    assert.throws(()=>p014ChooseFeedbackBranch(kind,0,()=>limit+1),
      /P014_INVALID_FEEDBACK_BRANCH/u);
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
  const handoff=(hadFocus:boolean,selector:string)=>p014HandoffFocus(
    trigger as unknown as HTMLButtonElement,hadFocus,
    scope as unknown as HTMLElement,selector);
  document.activeElement=trigger;
  assert.equal(handoff(false,'[data-p014-option="A"]'),false);
  assert.equal(document.activeElement,trigger);
  document.activeElement=body; // React removed the focused source button.
  assert.equal(handoff(true,'[data-p014-native-text="true"]'),true);
  assert.equal(document.activeElement,section);
  assert.equal(section.tabIndex,-1);
  document.activeElement=body;
  assert.equal(handoff(true,'[data-p014-option="A"]'),true);
  assert.equal(document.activeElement,answer);
  document.activeElement=answer; // The student tabbed away while SA Return awaited retirement.
  assert.equal(handoff(true,'[data-p014-native-text="true"]'),false);
  assert.equal(document.activeElement,answer);
});

test('Return focus picks active quiz answer or source Close, otherwise stable companion',()=>{
  const state=new AlgL06P014QuizStateV1();
  assert.equal(p014ReturnFocusSelector(state.snapshot(),null),
    '[data-p014-native-text="true"]');
  state.play();state.advanceMain(120);
  assert.equal(p014ReturnFocusSelector(state.snapshot(),null),'[data-p014-option="A"]');
  state.answer('AnsBtn1',1);
  assert.equal(p014ReturnFocusSelector(state.snapshot(),'A'),
    '[data-p014-native-text="true"]');
  state.advanceFeedback(22);
  assert.equal(p014ReturnFocusSelector(state.snapshot(),'A'),
    '[data-p014-feedback-ack="true"]');
  state.acknowledgeFeedback(state.snapshot().feedbackToken!);
  assert.equal(p014ReturnFocusSelector(state.snapshot(),'A'),
    '[data-p014-native-text="true"]');
});

test('closing glossary publishes the released held-quiz state without resuming playback',()=>{
  const state=new AlgL06P014QuizStateV1();
  state.play();state.advanceMain(120);
  state.openGlossary('Input');
  assert.equal(state.snapshot().answersEnabled,false);
  const refreshed=p014CloseGlossarySnapshot(state,()=>state.snapshot());
  assert.equal(refreshed.glossaryOpen,null);
  assert.equal(refreshed.mainFrame,120);
  assert.equal(refreshed.phase,'awaiting-answer');
  assert.equal(refreshed.answersEnabled,true);
  assert.equal(refreshed.playing,false);
});

test('Spanish UI and reduced motion never start SA or nine main assets during markup',()=>{
  const f=fixture();let mainLoads=0,saLoads=0;
  const html=renderToStaticMarkup(<P014PlayerV1 asset={f.asset}
    loadAudio={async()=>{mainLoads++;return new ArrayBuffer(0);}}
    loadSpanishAudio={async()=>{saLoads++;return new ArrayBuffer(0);}}
    language="es" reducedMotion onOpenGlossary={()=>{}}/>);
  assert.equal(mainLoads,0);assert.equal(saLoads,0);
  assert.match(html,/data-p014-player-phase="loading"/u);
  assert.match(html,/data-p014-audio-owner="main"/u);
  assert.match(html,/data-p014-sa-phase="idle"/u);
  assert.match(html,/data-p014-motion-policy="explicit-reduced"/u);
  assert.match(html,/Audio en español/u);
  assert.match(html,/<canvas[^>]*aria-hidden="true"/u);
});
