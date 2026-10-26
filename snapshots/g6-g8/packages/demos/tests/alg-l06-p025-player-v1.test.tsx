import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P025PlayerV1,p025CanOpenGlossary,p025PaintVerifiedFrame,
 type P025CanvasAssetV1} from '../src/alg-l06-p025-player-v1';
import {P025_TIMELINE} from '../src/alg-l06-p025-timeline-v1';
import {P025NativeTextV1} from '../src/alg-l06-p025-native-text-v1';
function fixture(){
 const attrs=new Map<string,string>();
 const canvas={getAttribute:(k:string)=>attrs.get(k)??null,setAttribute:(k:string,v:string)=>attrs.set(k,v)} as unknown as HTMLCanvasElement;
 const asset:P025CanvasAssetV1={metadata:{animationId:'shared-alg001-l06-p025',sourceSwfSha256:'dcb6b709d71eada47053b50bcfcc1161dec5d1717ebca6cbf8463eb6863dbde6',stage:{width:800,height:600},fps:12,deterministicContentTimeline:{timelineId:'sprite-21',frameCount:299},sourceGlyphRendering:{suppressTextIdsSupported:true,auditedStaticTextIds:[5,15]}},ready:async()=>undefined,render:(target,request)=>{
 target.setAttribute('data-flash-frame',String(request.frame));target.setAttribute('data-flash-frame-domain','sprite-21');target.setAttribute('data-flash-root-frame','6');return{localFrame:request.frame,frameDomain:'sprite-21',rootFrame:6,suppressedSourceTextIds:request.suppressTextIds??[]};}};
 return {canvas,asset};
}
function trigger(instanceId:string,id:number,key:string){
 const values=new Map([['data-source-button-instance-id',instanceId],['data-source-button-id',String(id)],['data-p025-glossary-key',key]]);
 const source=P025_TIMELINE.glossaryInstances.find(x=>x.instanceId===instanceId);
 if(source){values.set('data-source-action-sha256',source.sourceActionSha256);values.set('data-source-label-text-id',String(source.label.textId));
  values.set('data-source-label-segment',source.label.segment);
  values.set('data-source-button-visual-state','full-hit-and-own-blue-glyph');}
 const button={isConnected:true,disabled:false,getAttribute:(k:string)=>values.get(k)??null} as unknown as HTMLButtonElement;
 const scope={contains:(v:unknown)=>v===button} as HTMLElement;return{button,scope,values};
}
test('P025 Canvas commits exact sprite21/299 and rejects wrong source/domain/frame',()=>{
 const f=fixture();for(const frame of [1,2,27,28,40,41,49,50,51,52,294,295,298,299])p025PaintVerifiedFrame(f.asset,f.canvas,frame);
 assert.equal(f.canvas.getAttribute('data-flash-frame'),'299');
 assert.throws(()=>p025PaintVerifiedFrame(f.asset,f.canvas,300),/P025_INVALID_MAIN_FRAME/);
 assert.throws(()=>p025PaintVerifiedFrame({...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'wrong'}},f.canvas,1),/P025_CANVAS_ASSET_IDENTITY_MISMATCH/);
 const bad={...f.asset,render:()=>({localFrame:1,frameDomain:'root',rootFrame:6,suppressedSourceTextIds:[]})};
 assert.throws(()=>p025PaintVerifiedFrame(bad,f.canvas,1),/P025_CANVAS_FRAME_COMMIT_MISMATCH/);
});
test('every exact source glossary instance rejects early and forged controls',()=>{
 assert.deepEqual([...new Set(P025_TIMELINE.glossaryInstances.map(x=>x.key))].sort(),['Domain','Function','Independent variable','Input variable']);
 for(const instance of P025_TIMELINE.glossaryInstances){
  const f=trigger(instance.instanceId,instance.buttonId,instance.key);
  for(const [start,end] of instance.availableSpans){
   assert(p025CanOpenGlossary(instance.key,f.button,start,f.scope));assert(p025CanOpenGlossary(instance.key,f.button,end,f.scope));
   if(start>1)assert(!p025CanOpenGlossary(instance.key,f.button,start-1,f.scope));
   assert(!p025CanOpenGlossary(instance.key,f.button,start,{contains:()=>false} as unknown as HTMLElement));
  }
  f.values.set('data-source-action-sha256','wrong');assert(!p025CanOpenGlossary(instance.key,f.button,299,f.scope));
  f.values.set('data-source-action-sha256',instance.sourceActionSha256);
  f.values.set('data-source-label-text-id','999');assert(!p025CanOpenGlossary(instance.key,f.button,299,f.scope));
  f.values.set('data-source-label-text-id',String(instance.label.textId));
  f.values.set('data-source-label-segment','wrong');assert(!p025CanOpenGlossary(instance.key,f.button,299,f.scope));
  f.values.set('data-source-label-segment',instance.label.segment);
  f.values.set('data-source-button-visual-state','not-full-hit');assert(!p025CanOpenGlossary(instance.key,f.button,299,f.scope));
  f.values.set('data-source-button-visual-state','full-hit-and-own-blue-glyph');
  f.values.set('data-source-button-id','999');assert(!p025CanOpenGlossary(instance.key,f.button,299,f.scope));
 }
});
test('native controls and player authorization agree throughout all 299 source frames',()=>{
 for(let frame=1;frame<=299;frame++){
  const html=renderToStaticMarkup(<P025NativeTextV1 frame={frame} onGlossary={()=>{}}/>);
  const controls=[...html.matchAll(/<button\b[^>]*>/gu)].map(([tag])=>
   Object.fromEntries([...tag.matchAll(/([a-z0-9-]+)="([^"]*)"/gu)].map(([,key,value])=>[key,value])))
   .filter(attrs=>'data-p025-glossary-key' in attrs);
  const expected=P025_TIMELINE.glossaryInstances.filter(x=>x.availableSpans.some(([a,b])=>frame>=a&&frame<=b));
  assert.equal(controls.length,expected.length,`frame${frame}`);
  for(const attrs of controls){
   const key=attrs['data-p025-glossary-key'],instance=attrs['data-source-button-instance-id'];
   const f=trigger(instance,Number(attrs['data-source-button-id']),key);
   f.values.set('data-source-label-text-id',attrs['data-source-label-text-id']);
   f.values.set('data-source-label-segment',attrs['data-source-label-segment']);
   f.values.set('data-source-button-visual-state',attrs['data-source-button-visual-state']);
   f.values.set('data-source-action-sha256',attrs['data-source-action-sha256']);
   assert(p025CanOpenGlossary(key as Parameters<typeof p025CanOpenGlossary>[0],f.button,frame,f.scope));
  }
 }
});
test('ES reduced-motion initial render starts neither main nor optionalSA',()=>{
 const f=fixture();let main=0,sa=0;const html=renderToStaticMarkup(<P025PlayerV1 asset={f.asset} language="es" reducedMotion loadAudio={async()=>{main++;return new ArrayBuffer(0);}} loadSpanishAudio={async()=>{sa++;return new ArrayBuffer(0);}} onOpenGlossary={()=>{}}/>);
 assert.equal(main,0);assert.equal(sa,0);assert.match(html,/data-p025-sa-phase="idle"/);assert.match(html,/data-p025-motion-policy="explicit-reduced"/);assert.match(html,/Audio en español/);
});

test('native ownership and Canvas returned suppression must agree at both complete definitions',()=>{
 const f=fixture();
 for(const frame of [49,50,294,295,299])p025PaintVerifiedFrame(f.asset,f.canvas,frame);
 const bad={...f.asset,render:(target:HTMLCanvasElement,request:Parameters<P025CanvasAssetV1['render']>[1])=>{
  const rendered=f.asset.render(target,request);return {...rendered,suppressedSourceTextIds:[]};}};
 assert.throws(()=>p025PaintVerifiedFrame(bad,f.canvas,50),/P025_CANVAS_FRAME_COMMIT_MISMATCH/);
 assert.throws(()=>p025PaintVerifiedFrame({...f.asset,metadata:{...f.asset.metadata,
  sourceGlyphRendering:{suppressTextIdsSupported:true,auditedStaticTextIds:[5,10,15]}}},f.canvas,50),/P025_CANVAS_ASSET_IDENTITY_MISMATCH/);
});
