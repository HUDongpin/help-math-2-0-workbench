import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P023PlayerV1,p023CanOpenGlossary,p023PaintVerifiedFrame,
 type P023CanvasAssetV1} from '../src/alg-l06-p023-player-v1';
import {P023_TIMELINE} from '../src/alg-l06-p023-timeline-v1';
import {P023NativeTextV1} from '../src/alg-l06-p023-native-text-v1';
function fixture(){
 const attrs=new Map<string,string>();
 const canvas={getAttribute:(k:string)=>attrs.get(k)??null,setAttribute:(k:string,v:string)=>attrs.set(k,v)} as unknown as HTMLCanvasElement;
 const asset:P023CanvasAssetV1={metadata:{animationId:'shared-alg001-l06-p023',sourceSwfSha256:'40388017c66f714bdbda480558669aee11a0d3426ed55c74f0976eb2ca85097a',stage:{width:800,height:600},fps:12,deterministicContentTimeline:{timelineId:'sprite-38',frameCount:410}},ready:async()=>undefined,render:(target,request)=>{
 target.setAttribute('data-flash-frame',String(request.frame));target.setAttribute('data-flash-frame-domain','sprite-38');target.setAttribute('data-flash-root-frame','6');return{localFrame:request.frame,frameDomain:'sprite-38',rootFrame:6};}};
 return {canvas,asset};
}
function trigger(instanceId:string,id:number,key:string){
 const values=new Map([['data-source-button-instance-id',instanceId],['data-source-button-id',String(id)],['data-p023-glossary-key',key]]);
 const source=P023_TIMELINE.glossaryInstances.find(x=>x.instanceId===instanceId);
 if(source){values.set('data-source-action-sha256',source.sourceActionSha256);values.set('data-source-label-text-id',String(source.label.textId));
  values.set('data-source-label-segment',source.label.segment);
  values.set('data-source-button-visual-state','full-hit-and-own-blue-glyph');}
 const button={isConnected:true,disabled:false,getAttribute:(k:string)=>values.get(k)??null} as unknown as HTMLButtonElement;
 const scope={contains:(v:unknown)=>v===button} as HTMLElement;return{button,scope,values};
}
test('P023 Canvas commits exact sprite38/410 and rejects wrong source/domain/frame',()=>{
 const f=fixture();for(const frame of [1,11,20,21,29,30,46,47,67,68,132,173,394,401,409,410])p023PaintVerifiedFrame(f.asset,f.canvas,frame);
 assert.equal(f.canvas.getAttribute('data-flash-frame'),'410');
 assert.throws(()=>p023PaintVerifiedFrame(f.asset,f.canvas,411),/P023_INVALID_MAIN_FRAME/);
 assert.throws(()=>p023PaintVerifiedFrame({...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'wrong'}},f.canvas,1),/P023_CANVAS_ASSET_IDENTITY_MISMATCH/);
 const bad={...f.asset,render:()=>({localFrame:1,frameDomain:'root',rootFrame:6})};
 assert.throws(()=>p023PaintVerifiedFrame(bad,f.canvas,1),/P023_CANVAS_FRAME_COMMIT_MISMATCH/);
});
test('every exact source glossary instance rejects early and forged controls',()=>{
 assert.deepEqual([...new Set(P023_TIMELINE.glossaryInstances.map(x=>x.key))].sort(),['Domain','Function','Input','Set']);
 for(const instance of P023_TIMELINE.glossaryInstances){
  const f=trigger(instance.instanceId,instance.buttonId,instance.key);
  for(const [start,end] of instance.availableSpans){
   assert(p023CanOpenGlossary(instance.key,f.button,start,f.scope));assert(p023CanOpenGlossary(instance.key,f.button,end,f.scope));
   if(start>1)assert(!p023CanOpenGlossary(instance.key,f.button,start-1,f.scope));
   assert(!p023CanOpenGlossary(instance.key,f.button,start,{contains:()=>false} as unknown as HTMLElement));
  }
  f.values.set('data-source-action-sha256','wrong');assert(!p023CanOpenGlossary(instance.key,f.button,410,f.scope));
  f.values.set('data-source-action-sha256',instance.sourceActionSha256);
  f.values.set('data-source-label-text-id','999');assert(!p023CanOpenGlossary(instance.key,f.button,410,f.scope));
  f.values.set('data-source-label-text-id',String(instance.label.textId));
  f.values.set('data-source-label-segment','wrong');assert(!p023CanOpenGlossary(instance.key,f.button,410,f.scope));
  f.values.set('data-source-label-segment',instance.label.segment);
  f.values.set('data-source-button-visual-state','not-full-hit');assert(!p023CanOpenGlossary(instance.key,f.button,410,f.scope));
  f.values.set('data-source-button-visual-state','full-hit-and-own-blue-glyph');
  f.values.set('data-source-button-id','999');assert(!p023CanOpenGlossary(instance.key,f.button,410,f.scope));
 }
});
test('native controls and player authorization agree throughout all 410 source frames',()=>{
 for(let frame=1;frame<=410;frame++){
  const html=renderToStaticMarkup(<P023NativeTextV1 frame={frame} onGlossary={()=>{}}/>);
  const controls=[...html.matchAll(/<button\b[^>]*>/gu)].map(([tag])=>
   Object.fromEntries([...tag.matchAll(/([a-z0-9-]+)="([^"]*)"/gu)].map(([,key,value])=>[key,value])))
   .filter(attrs=>'data-p023-glossary-key' in attrs);
  const expected=P023_TIMELINE.glossaryInstances.filter(x=>x.availableSpans.some(([a,b])=>frame>=a&&frame<=b));
  assert.equal(controls.length,expected.length,`frame${frame}`);
  for(const attrs of controls){
   const key=attrs['data-p023-glossary-key'],instance=attrs['data-source-button-instance-id'];
   const f=trigger(instance,Number(attrs['data-source-button-id']),key);
   f.values.set('data-source-label-text-id',attrs['data-source-label-text-id']);
   f.values.set('data-source-label-segment',attrs['data-source-label-segment']);
   f.values.set('data-source-button-visual-state',attrs['data-source-button-visual-state']);
   f.values.set('data-source-action-sha256',attrs['data-source-action-sha256']);
   assert(p023CanOpenGlossary(key as Parameters<typeof p023CanOpenGlossary>[0],f.button,frame,f.scope));
  }
 }
});
test('ES reduced-motion initial render starts neither main nor optionalSA',()=>{
 const f=fixture();let main=0,sa=0;const html=renderToStaticMarkup(<P023PlayerV1 asset={f.asset} language="es" reducedMotion loadAudio={async()=>{main++;return new ArrayBuffer(0);}} loadSpanishAudio={async()=>{sa++;return new ArrayBuffer(0);}} onOpenGlossary={()=>{}}/>);
 assert.equal(main,0);assert.equal(sa,0);assert.match(html,/data-p023-sa-phase="idle"/);assert.match(html,/data-p023-motion-policy="explicit-reduced"/);assert.match(html,/Audio en español/);
});
