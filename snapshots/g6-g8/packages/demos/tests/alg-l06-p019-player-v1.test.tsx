import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P019PlayerV1,p019CanOpenGlossary,p019PaintVerifiedFrame,
 type P019CanvasAssetV1} from '../src/alg-l06-p019-player-v1';
import {P019_TIMELINE} from '../src/alg-l06-p019-timeline-v1';
import {P019NativeTextV1} from '../src/alg-l06-p019-native-text-v1';
function fixture(){
 const attrs=new Map<string,string>();
 const canvas={getAttribute:(k:string)=>attrs.get(k)??null,setAttribute:(k:string,v:string)=>attrs.set(k,v)} as unknown as HTMLCanvasElement;
 const asset:P019CanvasAssetV1={metadata:{animationId:'shared-alg001-l06-p019',sourceSwfSha256:'df8be172fd738ec4fca7bca02b0f166c88676f062170e6cee7b3a1081a91adec',stage:{width:800,height:600},fps:12,deterministicContentTimeline:{timelineId:'sprite-37',frameCount:351}},ready:async()=>undefined,render:(target,request)=>{
 target.setAttribute('data-flash-frame',String(request.frame));target.setAttribute('data-flash-frame-domain','sprite-37');target.setAttribute('data-flash-root-frame','6');return{localFrame:request.frame,frameDomain:'sprite-37',rootFrame:6};}};
 return {canvas,asset};
}
function trigger(instanceId:string,id:number,key:string){
 const values=new Map([['data-source-button-instance-id',instanceId],['data-source-button-id',String(id)],['data-p019-glossary-key',key]]);
 const source=P019_TIMELINE.glossaryInstances.find(x=>x.instanceId===instanceId);
 if(source){values.set('data-source-action-sha256',source.sourceActionSha256);values.set('data-source-label-text-id',String(source.label.textId));}
 const button={isConnected:true,disabled:false,getAttribute:(k:string)=>values.get(k)??null} as unknown as HTMLButtonElement;
 const scope={contains:(v:unknown)=>v===button} as HTMLElement;return{button,scope,values};
}
test('P019 Canvas commits exact sprite37/351 and rejects wrong source/domain/frame',()=>{
 const f=fixture();for(const frame of [1,2,57,168,181,182,351])p019PaintVerifiedFrame(f.asset,f.canvas,frame);
 assert.equal(f.canvas.getAttribute('data-flash-frame'),'351');
 assert.throws(()=>p019PaintVerifiedFrame(f.asset,f.canvas,352),/P019_INVALID_MAIN_FRAME/);
 assert.throws(()=>p019PaintVerifiedFrame({...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'wrong'}},f.canvas,1),/P019_CANVAS_ASSET_IDENTITY_MISMATCH/);
 const bad={...f.asset,render:()=>({localFrame:1,frameDomain:'root',rootFrame:6})};
 assert.throws(()=>p019PaintVerifiedFrame(bad,f.canvas,1),/P019_CANVAS_FRAME_COMMIT_MISMATCH/);
});
test('every exact source glossary instance rejects early and forged controls',()=>{
 assert.deepEqual([...new Set(P019_TIMELINE.glossaryInstances.map(x=>x.key))].sort(),['Function','Function table','Input','Output','Pair','Table']);
 for(const instance of P019_TIMELINE.glossaryInstances){
  const f=trigger(instance.instanceId,instance.buttonId,instance.key);
  for(const [start,end] of instance.availableSpans){
   assert(p019CanOpenGlossary(instance.key,f.button,start,f.scope));assert(p019CanOpenGlossary(instance.key,f.button,end,f.scope));
   if(start>1)assert(!p019CanOpenGlossary(instance.key,f.button,start-1,f.scope));
   assert(!p019CanOpenGlossary(instance.key,f.button,start,{contains:()=>false} as unknown as HTMLElement));
  }
  f.values.set('data-source-action-sha256','wrong');assert(!p019CanOpenGlossary(instance.key,f.button,351,f.scope));
  f.values.set('data-source-action-sha256',instance.sourceActionSha256);
  f.values.set('data-source-label-text-id','999');assert(!p019CanOpenGlossary(instance.key,f.button,351,f.scope));
  f.values.set('data-source-label-text-id',String(instance.label.textId));
  f.values.set('data-source-button-id','999');assert(!p019CanOpenGlossary(instance.key,f.button,351,f.scope));
 }
});
test('native controls and player authorization agree throughout all351 source frames',()=>{
 for(let frame=1;frame<=351;frame++){
  const html=renderToStaticMarkup(<P019NativeTextV1 frame={frame} onGlossary={()=>{}}/>);
  const controls=[...html.matchAll(/<button\b[^>]*data-p019-glossary-key="([^"]+)"[^>]*data-source-button-id="([^"]+)"[^>]*data-source-button-instance-id="([^"]+)"[^>]*data-source-label-text-id="([^"]+)"[^>]*data-source-action-sha256="([^"]+)"/gu)];
  const expected=P019_TIMELINE.glossaryInstances.filter(x=>x.availableSpans.some(([a,b])=>frame>=a&&frame<=b));
  assert.equal(controls.length,expected.length,`frame${frame}`);
  for(const [,key,id,instance,label,action] of controls){const f=trigger(instance,Number(id),key);f.values.set('data-source-label-text-id',label);f.values.set('data-source-action-sha256',action);assert(p019CanOpenGlossary(key as Parameters<typeof p019CanOpenGlossary>[0],f.button,frame,f.scope));}
 }
});
test('ES reduced-motion initial render starts neither main nor optionalSA',()=>{
 const f=fixture();let main=0,sa=0;const html=renderToStaticMarkup(<P019PlayerV1 asset={f.asset} language="es" reducedMotion loadAudio={async()=>{main++;return new ArrayBuffer(0);}} loadSpanishAudio={async()=>{sa++;return new ArrayBuffer(0);}} onOpenGlossary={()=>{}}/>);
 assert.equal(main,0);assert.equal(sa,0);assert.match(html,/data-p019-sa-phase="idle"/);assert.match(html,/data-p019-motion-policy="explicit-reduced"/);assert.match(html,/Audio en español/);
});
