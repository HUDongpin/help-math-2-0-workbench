import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P026PlayerV1,p026CanOpenGlossary,p026PaintVerifiedFrame,
  type P026CanvasAssetV1} from '../src/alg-l06-p026-player-v1';
import {P026_TIMELINE,p026TimelineState,type P026GlossaryKey}
  from '../src/alg-l06-p026-timeline-v1';
import {P026NativeTextV1} from '../src/alg-l06-p026-native-text-v1';

function fixture(){
  const attrs=new Map<string,string>();
  const canvas={getAttribute:(key:string)=>attrs.get(key)??null,
    setAttribute:(key:string,value:string)=>attrs.set(key,value)} as unknown as HTMLCanvasElement;
  const asset:P026CanvasAssetV1={metadata:{animationId:'shared-alg001-l06-p026',
    sourceSwfSha256:'a61e60f95dc597c7b0024e7f013abfade47e199ae911be77916d5b38c7828e0c',
    stage:{width:800,height:600},fps:12,
    deterministicContentTimeline:{timelineId:'sprite-55',frameCount:389},
    sourceGlyphRendering:{suppressTextIdsSupported:true,
      auditedStaticTextIds:[6,12,15,17,20,23,26,27,28,30]}},
    ready:async()=>undefined,
    render:(target,request)=>{
      target.setAttribute('data-flash-frame',String(request.frame));
      target.setAttribute('data-flash-frame-domain','sprite-55');
      target.setAttribute('data-flash-root-frame','6');
      return {localFrame:request.frame,frameDomain:'sprite-55',rootFrame:6,
        suppressedSourceTextIds:request.suppressSourceTextIds??[]};
    }};
  return {canvas,asset};
}
function trigger(instance:ReturnType<typeof p026TimelineState>['glossaryInstances'][number]){
  const values=new Map<string,string>([
    ['data-p026-glossary-key',instance.key],
    ['data-source-button-id',String(instance.buttonId)],
    ['data-source-button-instance-id',instance.instanceId],
    ['data-source-action-sha256',instance.sourceActionSha256],
    ['data-source-label-text-id',String(instance.label.textId)],
    ['data-source-label-instance-id',instance.label.textInstanceId],
    ['data-source-label-run-id',instance.label.sourceTextId],
    ['data-source-label-segment',instance.label.segment],
    ['data-source-button-visual-state','full-hit-and-own-blue-glyph'],
  ]);
  const button={isConnected:true,disabled:false,
    getAttribute:(key:string)=>values.get(key)??null} as unknown as HTMLButtonElement;
  const scope={contains:(child:unknown)=>child===button} as HTMLElement;
  return {button,scope,values};
}

test('P026 Canvas commits sprite-55 frame identity and only complete source paragraph suppression',()=>{
  const f=fixture();
  for(const frame of [1,2,3,6,19,31,81,145,147,148,159,195,196,200,253,389])
    p026PaintVerifiedFrame(f.asset,f.canvas,frame);
  assert.equal(f.canvas.getAttribute('data-flash-frame'),'389');
  assert.throws(()=>p026PaintVerifiedFrame(f.asset,f.canvas,390),/P026_INVALID_MAIN_FRAME/);
  const wrong={...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'wrong'}};
  assert.throws(()=>p026PaintVerifiedFrame(wrong,f.canvas,1),/P026_CANVAS_ASSET_IDENTITY_MISMATCH/);
  const skipped={...f.asset,render:(target:HTMLCanvasElement,
    request:Parameters<P026CanvasAssetV1['render']>[1])=>{
      const rendered=f.asset.render(target,request);
      return {...rendered,suppressedSourceTextIds:[]};}};
  const complete=Array.from({length:389},(_,index)=>index+1)
    .find(frame=>p026TimelineState(frame).suppressibleSourceTextIds.length>0)!;
  assert.throws(()=>p026PaintVerifiedFrame(skipped,f.canvas,complete),
    /P026_CANVAS_FRAME_COMMIT_MISMATCH/);
  let requestIds:readonly number[]=[];
  const capture={...f.asset,render:(target:HTMLCanvasElement,
    request:Parameters<P026CanvasAssetV1['render']>[1])=>{
      requestIds=request.suppressSourceTextIds??[];
      return f.asset.render(target,request);
    }};
  p026PaintVerifiedFrame(capture,f.canvas,31);
  assert.deepEqual(requestIds,[15,17],
    'depth order must be normalized for the audited Canvas API');
});

test('exact P026 glossary instances are gated by current source ink, hit region, and label identity',()=>{
  assert.deepEqual([...new Set(P026_TIMELINE.glossary.map(row=>row.key))].sort(),
    ['Dependent variable','Domain','Function','Independent variable',
      'Input variable','Output variable','Range']);
  const firstReady=new Map<P026GlossaryKey,number>();
  for(let frame=1;frame<=389;frame++){
    const state=p026TimelineState(frame);
    for(const instance of state.glossaryInstances.filter(x=>x.available)){
      if(!firstReady.has(instance.key))firstReady.set(instance.key,frame);
      const f=trigger(instance);
      assert(p026CanOpenGlossary(instance.key,f.button,frame,f.scope),
        `${instance.key} ${instance.instanceId} frame ${frame}`);
      f.values.set('data-source-label-instance-id','forged');
      assert(!p026CanOpenGlossary(instance.key,f.button,frame,f.scope));
    }
  }
  assert.equal(firstReady.get('Independent variable'),3);
  assert.equal(firstReady.get('Dependent variable'),51);
  assert.equal(firstReady.get('Output variable'),68);
  assert.equal(firstReady.get('Range'),131);
  const range147=p026TimelineState(147).glossaryInstances.filter(x=>x.key==='Range');
  assert(range147.every(x=>!x.available));
  const range148=p026TimelineState(148).glossaryInstances.find(x=>x.key==='Range'&&x.available)!;
  const f=trigger(range148);
  assert(!p026CanOpenGlossary('Range',f.button,147,f.scope));
  assert(p026CanOpenGlossary('Range',f.button,148,f.scope));
  assert(!p026CanOpenGlossary('Range',f.button,148,
    {contains:()=>false} as unknown as HTMLElement));
});

test('native controls carry the same per-instance source gate that player accepts',()=>{
  for(const frame of [2,3,19,31,50,51,68,80,130,131,145,147,148,160,161,389]){
    const html=renderToStaticMarkup(React.createElement(P026NativeTextV1,
      {frame,onGlossary:()=>{}}));
    const tags=[...html.matchAll(/<button\b[^>]*>/gu)].map(([tag])=>
      Object.fromEntries([...tag.matchAll(/([a-z0-9-]+)="([^"]*)"/gu)]
        .map(([,key,value])=>[key,value])));
    const expected=p026TimelineState(frame).glossaryInstances.filter(x=>x.available);
    assert.equal(tags.length,expected.length,`frame ${frame}`);
    for(const attrs of tags){
      const instance=expected.find(x=>x.instanceId===attrs['data-source-button-instance-id'])!;
      const f=trigger(instance);
      for(const [key,value] of Object.entries(attrs))if(key.startsWith('data-'))
        f.values.set(key,value);
      assert(p026CanOpenGlossary(instance.key,f.button,frame,f.scope));
    }
  }
});

test('ES and reduced motion do not automatically start main or separate SA',()=>{
  const f=fixture();let main=0,sa=0;
  const html=renderToStaticMarkup(React.createElement(P026PlayerV1,{
    asset:f.asset,language:'es',reducedMotion:true,
    loadAudio:async()=>{main++;return new ArrayBuffer(0);},
    loadSpanishAudio:async()=>{sa++;return new ArrayBuffer(0);},
    onOpenGlossary:()=>{},
  }));
  assert.equal(main,0);assert.equal(sa,0);
  assert.match(html,/data-p026-sa-phase="idle"/);
  assert.match(html,/data-p026-motion-policy="explicit-reduced"/);
  assert.match(html,/Audio en español/);
});
