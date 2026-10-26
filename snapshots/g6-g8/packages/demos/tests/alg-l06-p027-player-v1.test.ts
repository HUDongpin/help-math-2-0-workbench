import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P027PlayerV1,p027CanOpenGlossary,p027PaintVerifiedFrame,
  type P027CanvasAssetV1} from '../src/alg-l06-p027-player-v1';
import {P027_TIMELINE,p027TimelineState,type P027GlossaryKey}
  from '../src/alg-l06-p027-timeline-v1';
import {P027NativeTextV1} from '../src/alg-l06-p027-native-text-v1';
import {P027_MAIN_ASSET,P027_SA_ASSET} from '../src/alg-l06-p027-audio-schedule-v1';

function fixture(){
  const attrs=new Map<string,string>();
  const canvas={getAttribute:(key:string)=>attrs.get(key)??null,
    setAttribute:(key:string,value:string)=>attrs.set(key,value)} as unknown as HTMLCanvasElement;
  const asset:P027CanvasAssetV1={metadata:{animationId:'shared-alg001-l06-p027',
    sourceSwfSha256:'689318e75aac8740344e8ff119df34a288e7da24dc3dc0c62c0f22601666f984',
    stage:{width:800,height:600},fps:12,
    deterministicContentTimeline:{timelineId:'sprite-46',frameCount:770}},
    ready:async()=>undefined,
    render:(target,request)=>{
      target.setAttribute('data-flash-frame',String(request.frame));
      target.setAttribute('data-flash-frame-domain','sprite-46');
      target.setAttribute('data-flash-root-frame','6');
      return {localFrame:request.frame,frameDomain:'sprite-46',rootFrame:6,
        suppressedSourceTextIds:[]};
    }};
  return {canvas,asset};
}
function trigger(instance:ReturnType<typeof p027TimelineState>['glossaryInstances'][number]){
  const values=new Map<string,string>([
    ['data-p027-glossary-key',instance.key],
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

test('P027 Canvas commits sprite-46 frames and never suppresses source glyphs',()=>{
  const f=fixture();
  for(const frame of [1,2,3,16,56,65,153,156,217,265,300,315,414,429,618,633,660,675,770])
    p027PaintVerifiedFrame(f.asset,f.canvas,frame);
  assert.equal(f.canvas.getAttribute('data-flash-frame'),'770');
  assert.throws(()=>p027PaintVerifiedFrame(f.asset,f.canvas,771),/P027_INVALID_MAIN_FRAME/);
  const wrong={...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'wrong'}};
  assert.throws(()=>p027PaintVerifiedFrame(wrong,f.canvas,1),/P027_CANVAS_ASSET_IDENTITY_MISMATCH/);
  const suppressed={...f.asset,render:(target:HTMLCanvasElement,
    request:Parameters<P027CanvasAssetV1['render']>[1])=>{
      const rendered=f.asset.render(target,request);
      return {...rendered,suppressedSourceTextIds:[5]};}};
  assert.throws(()=>p027PaintVerifiedFrame(suppressed,f.canvas,300),
    /P027_CANVAS_FRAME_COMMIT_MISMATCH/);
  let requestKeys:string[]=[];
  const capture={...f.asset,render:(target:HTMLCanvasElement,
    request:Parameters<P027CanvasAssetV1['render']>[1])=>{
      requestKeys=Object.keys(request);
      return f.asset.render(target,request);
    }};
  p027PaintVerifiedFrame(capture,f.canvas,300);
  assert(!requestKeys.includes('suppressSourceTextIds'));
});

test('exact P027 glossary instances are gated by current source ink, hit region, and label identity',()=>{
  assert.deepEqual([...new Set(P027_TIMELINE.glossary.map(row=>row.key))].sort(),
    ['Function','Graph','Line','Point','Vertical','Vertical-line test']);
  const firstReady=new Map<P027GlossaryKey,number>();
  for(let frame=1;frame<=770;frame++){
    const state=p027TimelineState(frame);
    for(const instance of state.glossaryInstances.filter(x=>x.available)){
      if(!firstReady.has(instance.key))firstReady.set(instance.key,frame);
      const f=trigger(instance);
      assert(p027CanOpenGlossary(instance.key,f.button,frame,f.scope),
        `${instance.key} ${instance.instanceId} frame ${frame}`);
      f.values.set('data-source-label-instance-id','forged');
      assert(!p027CanOpenGlossary(instance.key,f.button,frame,f.scope));
    }
  }
  assert.deepEqual([...firstReady], [['Vertical-line test',16],['Graph',56],
    ['Function',65],['Vertical',153],['Line',156],['Point',217]]);
  const point=p027TimelineState(217).glossaryInstances.find(x=>x.key==='Point'&&x.available)!;
  const f=trigger(point);
  assert(!p027CanOpenGlossary('Point',f.button,216,f.scope));
  assert(p027CanOpenGlossary('Point',f.button,217,f.scope));
  assert(!p027CanOpenGlossary('Point',f.button,217,
    {contains:()=>false} as unknown as HTMLElement));
});

test('native controls carry the same per-instance source gate that player accepts',()=>{
  for(const frame of [2,3,16,55,56,64,65,152,153,155,156,194,216,217,770]){
    const html=renderToStaticMarkup(React.createElement(P027NativeTextV1,
      {frame,onGlossary:()=>{}}));
    const tags=[...html.matchAll(/<button\b[^>]*>/gu)].map(([tag])=>
      Object.fromEntries([...tag.matchAll(/([a-z0-9-]+)="([^"]*)"/gu)]
        .map(([,key,value])=>[key,value])));
    const expected=p027TimelineState(frame).glossaryInstances.filter(x=>x.available);
    assert.equal(tags.length,expected.length,`frame ${frame}`);
    for(const attrs of tags){
      const instance=expected.find(x=>x.instanceId===attrs['data-source-button-instance-id'])!;
      const f=trigger(instance);
      for(const [key,value] of Object.entries(attrs))if(key.startsWith('data-'))
        f.values.set(key,value);
      assert(p027CanOpenGlossary(instance.key,f.button,frame,f.scope));
    }
  }
});

test('ES and reduced motion do not automatically start main or separate SA',()=>{
  const f=fixture();let main=0,sa=0;
  const html=renderToStaticMarkup(React.createElement(P027PlayerV1,{
    asset:f.asset,language:'es',reducedMotion:true,
    audioBinding:{sourceSha256:P027_MAIN_ASSET.sourceSha256,
      sourceBytes:P027_MAIN_ASSET.sourceBytes,sampleRate:22050,channels:1,
      decodedSamples:1412352,pcmSha256:'a'.repeat(64)},
    spanishBinding:{sourceSha256:P027_SA_ASSET.sourceSha256,
      sourceBytes:P027_SA_ASSET.sourceBytes,sampleRate:48000,channels:1,
      decodedSamples:1307520,pcmSha256:'b'.repeat(64)},
    loadAudio:async()=>{main++;return new ArrayBuffer(0);},
    loadSpanishAudio:async()=>{sa++;return new ArrayBuffer(0);},
    onOpenGlossary:()=>{},
  }));
  assert.equal(main,0);assert.equal(sa,0);
  assert.match(html,/data-p027-sa-phase="idle"/);
  assert.match(html,/data-p027-motion-policy="explicit-reduced"/);
  assert.match(html,/Audio en español/);
});
