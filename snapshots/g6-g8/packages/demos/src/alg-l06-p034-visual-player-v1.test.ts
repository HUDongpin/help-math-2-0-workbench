import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {p034InitialDrag} from './alg-l06-p034-drag-v1';
import {p034GlossaryState} from './alg-l06-p034-glossary-v1';
import {p034NativeTextState} from './native-text/alg-l06-p034-native';
import {P034VisualPlayerV1,p034CanOpenCommittedGlossary,p034CommitMatches,
  p034LiveClickCommit,p034PaintRequestedClockFrame,p034PaintVerifiedFrame,
  type P034CanvasAssetV1,type P034CanvasRequestV1,type P034CanvasResultV1}
 from './alg-l06-p034-visual-player-v1';

function mockCanvas(){
 const attrs=new Map<string,string>();
 return {width:800,height:600,
  setAttribute:(key:string,value:string)=>attrs.set(key,value),
  getAttribute:(key:string)=>attrs.get(key)??null} as unknown as HTMLCanvasElement;
}
function mockAsset(overrides?:Partial<P034CanvasAssetV1['metadata']>):P034CanvasAssetV1 {
 const metadata={animationId:'shared-alg001-l06-p034',
  sourceSwfSha256:'32ddbfde743b785610360f38b7030ab2dbd289438f6c4433e6699ce3004a629a',
  stage:{width:800,height:600},fps:12,
  generatorInput:{framesHtmlSha256:'e8dd54605b1170b2ca6e920384863e9f609576b086ee18bd21a4e1a715c07630'},
  sourceRootTimeline:{frameCount:13,beginFrame:6},
  deterministicContentTimeline:{timelineId:'sprite-40',frameCount:434},
  audioRendering:'not-included',...overrides};
 const state=(request:P034CanvasRequestV1):P034CanvasResultV1=>({
  localFrame:request.frame,frameDomain:'sprite-40',rootFrame:6,
  scenario:request.scenario,lang:request.lang,seed:request.seed,
  audioRendered:false,line:request.line});
 return {metadata,ready:async()=>undefined,resolveFrameState:state,
  render:(canvas,request)=>{
   canvas.setAttribute('data-flash-frame',String(request.frame));
   canvas.setAttribute('data-flash-frame-domain','sprite-40');
   canvas.setAttribute('data-flash-root-frame','6');
   canvas.setAttribute('data-runtime-scenario','source-static-frame');
   canvas.setAttribute('data-runtime-seed','0');
   return state(request);
  }};
}

test('verified paint binds actual Canvas API identity, frame and line atomically',()=>{
 const asset=mockAsset(),canvas=mockCanvas();
 const hidden=p034PaintVerifiedFrame(asset,canvas,432,
  {visible:false,xGraphLocalPixels:0.2});
 assert.equal(hidden.line.visible,false);
 assert.equal(canvas.getAttribute('data-flash-frame'),'432');
 const shown=p034PaintVerifiedFrame(asset,canvas,433,
  {visible:true,xGraphLocalPixels:12});
 assert.equal(shown.line.xGraphLocalPixels,12);
 assert.equal(canvas.getAttribute('data-p034-line-visible'),'true');
 assert.equal(canvas.getAttribute('data-p034-line-x'),'12');
 assert(p034CommitMatches({asset,frame:433,replayToken:0,visible:true,
  xGraphLocalPixels:12},asset,canvas,{...p034InitialDrag(433),visible:true,
  xGraphLocalPixels:12}));
 assert(!p034CommitMatches({asset,frame:433,replayToken:0,visible:true,
  xGraphLocalPixels:12},asset,canvas,{...p034InitialDrag(433,1),visible:true,
  xGraphLocalPixels:12}));
});

test('identity, source graph timing and a stale Canvas result fail closed',()=>{
 const canvas=mockCanvas();
 assert.throws(()=>p034PaintVerifiedFrame(mockAsset({sourceSwfSha256:'wrong'}),
  canvas,433,{visible:false,xGraphLocalPixels:0.2}),/IDENTITY_MISMATCH/u);
 assert.throws(()=>p034PaintVerifiedFrame(mockAsset(),canvas,432,
  {visible:true,xGraphLocalPixels:0}),/INVALID_FRAME_LINE/u);
 assert.throws(()=>p034PaintVerifiedFrame(mockAsset(),canvas,433,
  {visible:true,xGraphLocalPixels:71}),/INVALID_FRAME_LINE/u);
 const stale=mockAsset();
 const broken={...stale,render:(_canvas:HTMLCanvasElement,request:P034CanvasRequestV1)=>({
  localFrame:request.frame-1,frameDomain:'sprite-40',rootFrame:6,
  scenario:request.scenario,lang:request.lang,seed:request.seed,
  audioRendered:false,line:request.line})};
 assert.throws(()=>p034PaintVerifiedFrame(broken,canvas,433,
  {visible:false,xGraphLocalPixels:0.2}),/COMMIT_MISMATCH/u);
});

test('visual owner exposes only modern graph input at 433 and keeps source language honest',()=>{
 const asset=mockAsset();
 const early=renderToStaticMarkup(React.createElement(P034VisualPlayerV1,
  {asset,frame:432,language:'es'}));
 assert(!early.includes('class="p034-graph-input"'));
 const held=renderToStaticMarkup(React.createElement(P034VisualPlayerV1,
  {asset,frame:433,language:'es'}));
 assert(held.includes('data-p034-input-policy="modern-engineering-range-not-original-runtime"'));
 assert(held.includes('role="slider"'));
 assert(held.includes('Cargando visual de la lección'));
 assert(!held.includes('data-p034-native-text="true"'),
  'native text waits for an exact Canvas commit');
});

test('clock frame ACK requires actual current Canvas draw and rejects stale frames or assets',()=>{
 const asset=mockAsset(),canvas=mockCanvas();
 assert.equal(p034PaintRequestedClockFrame(asset,canvas,false,1,0,null,p034InitialDrag(1)),null);
 assert.equal(p034PaintRequestedClockFrame(asset,canvas,true,434,0,null,p034InitialDrag(1)),null);
 const first=p034PaintRequestedClockFrame(asset,canvas,true,1,0,null,p034InitialDrag(1));
 assert(first);assert.equal(canvas.getAttribute('data-flash-frame'),'1');
 const next=p034PaintRequestedClockFrame(asset,canvas,true,433,0,first.commit,first.drag);
 assert(next);assert.equal(canvas.getAttribute('data-flash-frame'),'433');
 assert.equal(p034PaintRequestedClockFrame(asset,canvas,true,432,0,next.commit,next.drag),null);
 const replay=p034PaintRequestedClockFrame(asset,canvas,true,1,1,next.commit,next.drag);
 assert(replay);assert.equal(replay.drag.visible,false);
 assert.equal(canvas.getAttribute('data-flash-frame'),'1');
 assert.equal(p034PaintRequestedClockFrame(asset,canvas,true,433,0,replay.commit,replay.drag),null);
 assert.equal(p034PaintRequestedClockFrame(mockAsset(),canvas,true,2,1,replay.commit,replay.drag),null);
 const corrupt={...asset,render:()=>({localFrame:0,frameDomain:'sprite-40',rootFrame:6,
  scenario:'source-static-frame',lang:'en',seed:0,audioRendered:false,
  line:{visible:false,xGraphLocalPixels:0.2}} as P034CanvasResultV1)};
 assert.equal(p034PaintRequestedClockFrame(corrupt,canvas,true,2,1,null,replay.drag),null);
});

test('source glossary gate is tied to available masked label and exact committed frame',()=>{
 assert(!p034CanOpenCommittedGlossary('Function',1,1));
 assert(p034CanOpenCommittedGlossary('Function',74,74));
 assert(!p034CanOpenCommittedGlossary('Function',74,73));
 assert(!p034CanOpenCommittedGlossary('Line',74,74));
 assert(p034CanOpenCommittedGlossary('Line',124,124));
 const frame=124,control=p034GlossaryState(frame,p034NativeTextState(frame))
  .find(x=>x.key==='Function'&&x.available);
 assert(control);
 const attrs=new Map<string,string>([
  ['data-p034-glossary-key',control.key],['data-source-button-id',String(control.buttonId)],
  ['data-source-button-instance-id',control.buttonInstanceId],
  ['data-source-action-sha256',control.sourceActionSha256],
  ['data-source-label-instance-id',control.label.instanceId],
  ['data-source-label-run-id',control.label.sourceRunId],
  ['data-source-label-segment',control.label.segment],
  ['data-source-button-visual-state','full-own-blue-glyph-and-hit'],
 ]);
 const trigger=({isConnected:true,disabled:false,
  getAttribute:(name:string)=>attrs.get(name)??null}) as unknown as HTMLButtonElement;
 const scope=({isConnected:true,contains:(value:unknown)=>value===trigger,
  getAttribute:(name:string)=>name==='data-p034-frame'?String(frame):null}) as unknown as HTMLElement;
 const canvas=mockCanvas();
 p034PaintVerifiedFrame(mockAsset(),canvas,frame,{visible:false,xGraphLocalPixels:0.2});
 const context={trigger,scope,canvas};
 assert(p034CanOpenCommittedGlossary('Function',frame,frame,context));
 trigger.disabled=true;
 assert(!p034CanOpenCommittedGlossary('Function',frame,frame,context));
 trigger.disabled=false;attrs.set('data-source-button-instance-id','another-companion');
 assert(!p034CanOpenCommittedGlossary('Function',frame,frame,context));
});

test('pending Canvas commit can publish a persistent Function trigger in the same replay',()=>{
 const asset=mockAsset(),canvas=mockCanvas();
 const old=p034PaintRequestedClockFrame(asset,canvas,true,205,0,null,p034InitialDrag(205));
 assert(old);
 const painted=p034PaintRequestedClockFrame(asset,canvas,true,206,0,old.commit,old.drag);
 assert(painted);
 assert.equal(p034LiveClickCommit(painted.commit,asset,canvas,painted.drag,205,0),painted.commit);
 assert.equal(p034LiveClickCommit(painted.commit,asset,canvas,painted.drag,205,1),null,
  'a prior replay click cannot publish the new replay');
 const control=p034GlossaryState(205,p034NativeTextState(205))
  .find(x=>x.key==='Function'&&x.available);
 const successor=p034GlossaryState(206,p034NativeTextState(206))
  .find(x=>x.key==='Function'&&x.available);
 assert(control&&successor);
 assert.equal(control.buttonInstanceId,successor.buttonInstanceId);
 const attrs=new Map<string,string>([
  ['data-p034-glossary-key',control.key],['data-source-button-id',String(control.buttonId)],
  ['data-source-button-instance-id',control.buttonInstanceId],
  ['data-source-action-sha256',control.sourceActionSha256],
  ['data-source-label-instance-id',control.label.instanceId],
  ['data-source-label-run-id',control.label.sourceRunId],
  ['data-source-label-segment',control.label.segment],
  ['data-source-button-visual-state','full-own-blue-glyph-and-hit'],
 ]);
 const trigger=({isConnected:true,disabled:false,
  getAttribute:(name:string)=>attrs.get(name)??null}) as unknown as HTMLButtonElement;
 let publishedFrame=205;
 const scope=({isConnected:true,contains:(value:unknown)=>value===trigger,
  getAttribute:(name:string)=>name==='data-p034-frame'?String(publishedFrame):null}) as unknown as HTMLElement;
 assert(!p034CanOpenCommittedGlossary('Function',205,206,{trigger,scope,canvas}),
  'the captured old frame is not the Canvas commit');
 publishedFrame=206;
 assert(p034CanOpenCommittedGlossary('Function',206,206,{trigger,scope,canvas}),
  'the same physical trigger is valid after the painted frame is published');
});

test('publishing frame 195 cannot reinterpret a frame-194 Function trigger',()=>{
 const asset=mockAsset(),canvas=mockCanvas();
 const old=p034PaintRequestedClockFrame(asset,canvas,true,194,0,null,p034InitialDrag(194));
 assert(old);
 const painted=p034PaintRequestedClockFrame(asset,canvas,true,195,0,old.commit,old.drag);
 assert(painted);
 assert.equal(p034LiveClickCommit(painted.commit,asset,canvas,painted.drag,194,0),painted.commit);
 const before=p034GlossaryState(194,p034NativeTextState(194))
  .find(x=>x.key==='Function'&&x.available);
 const after=p034GlossaryState(195,p034NativeTextState(195))
  .find(x=>x.key==='Function'&&x.available);
 assert(before&&after);
 assert.notEqual(before.buttonInstanceId,after.buttonInstanceId);
 const attrs=new Map<string,string>([
  ['data-p034-glossary-key',before.key],['data-source-button-id',String(before.buttonId)],
  ['data-source-button-instance-id',before.buttonInstanceId],
  ['data-source-action-sha256',before.sourceActionSha256],
  ['data-source-label-instance-id',before.label.instanceId],
  ['data-source-label-run-id',before.label.sourceRunId],
  ['data-source-label-segment',before.label.segment],
  ['data-source-button-visual-state','full-own-blue-glyph-and-hit'],
 ]);
 let connected=true;
 const trigger=({get isConnected(){return connected;},disabled:false,
  getAttribute:(name:string)=>attrs.get(name)??null}) as unknown as HTMLButtonElement;
 const scope=({isConnected:true,contains:(value:unknown)=>value===trigger,
  getAttribute:(name:string)=>name==='data-p034-frame'?'195':null}) as unknown as HTMLElement;
 assert(!p034CanOpenCommittedGlossary('Function',195,195,{trigger,scope,canvas}),
  'the old source button cannot stand in for the replacement instance');
 connected=false;
 assert(!p034CanOpenCommittedGlossary('Function',195,195,{trigger,scope,canvas}));
});
