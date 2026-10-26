import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {P042NativeCompanionV1} from './alg-l06-p042-native-v1';
import {p042PaintFrame,type P042CanvasAssetV1,type P042CanvasRequestV1}
  from './alg-l06-p042-player-v1';
import {p042InitialState,p042Reduce,type P042Event,type P042State}
  from './alg-l06-p042-state-v1';

type EventWithoutEpoch=P042Event extends infer Event
  ?Event extends P042Event?Omit<Event,'epoch'>:never:never;
function next(state:P042State,event:EventWithoutEpoch):P042State{
  const result=p042Reduce(state,{...event,epoch:state.epoch} as P042Event);
  assert.equal(result.accepted,true,result.reason);
  return result.state;
}
function stage(){
  const attrs=new Map<string,string>();
  return {width:800,height:600,
    setAttribute:(name:string,value:string)=>attrs.set(name,value),
    getAttribute:(name:string)=>attrs.get(name)??null} as unknown as HTMLCanvasElement;
}
function asset(requests:P042CanvasRequestV1[]):P042CanvasAssetV1{
  return {ready:async()=>{},
    resolveFrameState:request=>({localFrame:request.frame,frameDomain:'sprite-341',
      rootFrame:6,nmhOpen:request.nmhOpen,
      feedback:request.feedback&&{...request.feedback,sourceReachable:true}}),
    render:(canvas,request)=>{
      requests.push(request);
      canvas.setAttribute('data-flash-frame',String(request.frame));
      canvas.setAttribute('data-flash-frame-domain','sprite-341');
      canvas.setAttribute('data-flash-root-frame','6');
      canvas.setAttribute('data-p042-feedback-sprite',
        request.feedback?String(request.feedback.spriteId):'none');
      canvas.setAttribute('data-p042-feedback-frame',
        request.feedback?String(request.feedback.localFrame):'none');
      canvas.setAttribute('data-p042-nmh-open',String(request.nmhOpen));
    }};
}
function heldQuiz(){
  let state=p042InitialState();
  state=next(state,{type:'start-main'});
  state=next(state,{type:'advance-main',frame:279});
  return state;
}

test('P042 Canvas request follows source-held main, NMH and selected feedback',()=>{
  const requests:P042CanvasRequestV1[]=[];
  const canvas=stage(),drawing=asset(requests);
  let state=heldQuiz();
  assert.equal(p042PaintFrame(drawing,canvas,state),true);
  assert.deepEqual(requests.at(-1),{frame:279,feedback:null,nmhOpen:false,
    scenario:'source-explicit-frames',lang:'en',seed:0});
  state=next(state,{type:'open-nmh',quizGeneration:state.quizGeneration});
  p042PaintFrame(drawing,canvas,state);
  assert.equal(requests.at(-1)?.nmhOpen,true);
  assert.equal(canvas.getAttribute('data-p042-nmh-open'),'true');
  state=next(state,{type:'close-nmh',quizGeneration:state.quizGeneration});
  state=next(state,{type:'choose',choice:'B',quizGeneration:state.quizGeneration});
  p042PaintFrame(drawing,canvas,state);
  assert.deepEqual(requests.at(-1)?.feedback,{spriteId:292,localFrame:2});
  state=next(state,{type:'advance-feedback',token:state.feedback!.token,frame:22});
  p042PaintFrame(drawing,canvas,state);
  assert.equal(canvas.getAttribute('data-p042-feedback-sprite'),'292');
  assert.equal(canvas.getAttribute('data-p042-feedback-frame'),'22');
  assert.equal(canvas.getAttribute('data-p042-state-epoch'),'0');
  assert.equal(canvas.getAttribute('data-p042-phase'),'wrong-feedback-held');
});

test('P042 Canvas rejects a mismatched resolution or incomplete commit',()=>{
  const state=heldQuiz(),canvas=stage(),drawing=asset([]);
  const wrongResolution={...drawing,resolveFrameState:(request:P042CanvasRequestV1)=>
    ({localFrame:request.frame,frameDomain:'sprite-341',rootFrame:6,
      feedback:null,nmhOpen:true})};
  assert.throws(()=>p042PaintFrame(wrongResolution,canvas,state),
    /P042_CANVAS_RESOLUTION_MISMATCH/u);
  const incomplete={...drawing,render:()=>{}};
  assert.throws(()=>p042PaintFrame(incomplete,canvas,state),
    /P042_CANVAS_COMMIT_MISMATCH/u);
  const wrongSize=stage();wrongSize.width=799;
  assert.throws(()=>p042PaintFrame(drawing,wrongSize,state),
    /P042_CANVAS_IDENTITY_MISMATCH/u);
});

test('P042 native glossary gives the host the clicked real button',()=>{
  const state=heldQuiz();
  const trigger={id:'source-glossary-button'} as HTMLButtonElement;
  let received:unknown[]=[];
  const tree=P042NativeCompanionV1({state,language:'es',
    onGlossary:(id,epoch,generation,button)=>{
      received=[id,epoch,generation,button];}});
  function findGlossary(node:unknown):React.ReactElement|null{
    if(Array.isArray(node)){
      for(const child of node){const found=findGlossary(child);if(found)return found;}
      return null;
    }
    if(!React.isValidElement(node))return null;
    const props=node.props as Record<string,unknown>;
    if(props['data-source-glossary-button-id']===153)return node;
    return findGlossary(props.children);
  }
  const button=findGlossary(tree);
  assert(button);
  (button.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(received,[153,0,state.quizGeneration,trigger]);
});
