import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P021PlayerV1,p021CanOpenGlossary,p021PaintVerifiedFrame,
 type P021CanvasAssetV1} from '../src/alg-l06-p021-player-v1';
import {P021_TIMELINE} from '../src/alg-l06-p021-timeline-v1';
import {P021NativeTextV1} from '../src/alg-l06-p021-native-text-v1';
function fixture(){
 const attrs=new Map<string,string>();
 const canvas={getAttribute:(k:string)=>attrs.get(k)??null,setAttribute:(k:string,v:string)=>attrs.set(k,v)} as unknown as HTMLCanvasElement;
 const asset:P021CanvasAssetV1={metadata:{animationId:'shared-alg001-l06-p021',sourceSwfSha256:'4e87aacf4c5f749f559817dc2c0ec8b023fba75652217b9ce2543728e06eb5eb',stage:{width:800,height:600},fps:12,deterministicContentTimeline:{timelineId:'sprite-43',frameCount:377}},ready:async()=>undefined,render:(target,request)=>{
 target.setAttribute('data-flash-frame',String(request.frame));target.setAttribute('data-flash-frame-domain','sprite-43');target.setAttribute('data-flash-root-frame','6');return{localFrame:request.frame,frameDomain:'sprite-43',rootFrame:6};}};
 return {canvas,asset};
}
function trigger(instanceId:string,id:number,key:string){
 const values=new Map([['data-source-button-instance-id',instanceId],['data-source-button-id',String(id)],['data-p021-glossary-key',key]]);
 const source=P021_TIMELINE.glossaryInstances.find(x=>x.instanceId===instanceId);
 if(source){values.set('data-source-action-sha256',source.sourceActionSha256);values.set('data-source-label-text-id',String(source.label.textId));}
 const button={isConnected:true,disabled:false,getAttribute:(k:string)=>values.get(k)??null} as unknown as HTMLButtonElement;
 const scope={contains:(v:unknown)=>v===button} as HTMLElement;return{button,scope,values};
}
test('P021 Canvas commits exact sprite43/377 and rejects wrong source/domain/frame',()=>{
 const f=fixture();for(const frame of [1,2,57,168,181,182,377])p021PaintVerifiedFrame(f.asset,f.canvas,frame);
 assert.equal(f.canvas.getAttribute('data-flash-frame'),'377');
 assert.throws(()=>p021PaintVerifiedFrame(f.asset,f.canvas,378),/P021_INVALID_MAIN_FRAME/);
 assert.throws(()=>p021PaintVerifiedFrame({...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'wrong'}},f.canvas,1),/P021_CANVAS_ASSET_IDENTITY_MISMATCH/);
 const bad={...f.asset,render:()=>({localFrame:1,frameDomain:'root',rootFrame:6})};
 assert.throws(()=>p021PaintVerifiedFrame(bad,f.canvas,1),/P021_CANVAS_FRAME_COMMIT_MISMATCH/);
});
test('every exact source glossary instance rejects early and forged controls',()=>{
 assert.deepEqual([...new Set(P021_TIMELINE.glossaryInstances.map(x=>x.key))].sort(),['Function','Input','Ordered pair','Output','Set','Value']);
 for(const instance of P021_TIMELINE.glossaryInstances){
  const f=trigger(instance.instanceId,instance.buttonId,instance.key);
  for(const [start,end] of instance.availableSpans){
   assert(p021CanOpenGlossary(instance.key,f.button,start,f.scope));assert(p021CanOpenGlossary(instance.key,f.button,end,f.scope));
   if(start>1)assert(!p021CanOpenGlossary(instance.key,f.button,start-1,f.scope));
   assert(!p021CanOpenGlossary(instance.key,f.button,start,{contains:()=>false} as unknown as HTMLElement));
  }
  f.values.set('data-source-action-sha256','wrong');assert(!p021CanOpenGlossary(instance.key,f.button,377,f.scope));
  f.values.set('data-source-action-sha256',instance.sourceActionSha256);
  f.values.set('data-source-label-text-id','999');assert(!p021CanOpenGlossary(instance.key,f.button,377,f.scope));
  f.values.set('data-source-label-text-id',String(instance.label.textId));
  f.values.set('data-source-button-id','999');assert(!p021CanOpenGlossary(instance.key,f.button,377,f.scope));
 }
});
test('native controls and player authorization agree throughout all377 source frames',()=>{
 for(let frame=1;frame<=377;frame++){
  const html=renderToStaticMarkup(<P021NativeTextV1 frame={frame} onGlossary={()=>{}}/>);
  const controls=[...html.matchAll(/<button\b[^>]*>/gu)].map(([tag])=>
   Object.fromEntries([...tag.matchAll(/([a-z0-9-]+)="([^"]*)"/gu)].map(([,key,value])=>[key,value])))
   .filter(attrs=>'data-p021-glossary-key' in attrs);
  const expected=P021_TIMELINE.glossaryInstances.filter(x=>x.availableSpans.some(([a,b])=>frame>=a&&frame<=b));
  assert.equal(controls.length,expected.length,`frame${frame}`);
  for(const attrs of controls){
   const key=attrs['data-p021-glossary-key'],instance=attrs['data-source-button-instance-id'];
   const f=trigger(instance,Number(attrs['data-source-button-id']),key);
   f.values.set('data-source-label-text-id',attrs['data-source-label-text-id']);
   f.values.set('data-source-action-sha256',attrs['data-source-action-sha256']);
   assert(p021CanOpenGlossary(key as Parameters<typeof p021CanOpenGlossary>[0],f.button,frame,f.scope));
  }
 }
});
test('ES reduced-motion initial render starts neither main nor optionalSA',()=>{
 const f=fixture();let main=0,sa=0;const html=renderToStaticMarkup(<P021PlayerV1 asset={f.asset} language="es" reducedMotion loadAudio={async()=>{main++;return new ArrayBuffer(0);}} loadSpanishAudio={async()=>{sa++;return new ArrayBuffer(0);}} onOpenGlossary={()=>{}}/>);
 assert.equal(main,0);assert.equal(sa,0);assert.match(html,/data-p021-sa-phase="idle"/);assert.match(html,/data-p021-motion-policy="explicit-reduced"/);assert.match(html,/Audio en español/);
});
