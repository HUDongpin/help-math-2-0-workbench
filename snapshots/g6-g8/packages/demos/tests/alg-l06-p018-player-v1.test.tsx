import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P018PlayerV1,p018CanOpenGlossary,p018PaintVerifiedFrame,
  type P018CanvasAssetV1} from '../src/alg-l06-p018-player-v1';
import {P018NativeTextV1} from '../src/alg-l06-p018-native-text-v1';
import {P018_TIMELINE} from '../src/alg-l06-p018-timeline-v1';

function canvasFixture(){
  const attrs=new Map<string,string>();
  const canvas={width:800,height:600,getAttribute:(key:string)=>attrs.get(key)??null,
    setAttribute:(key:string,value:string)=>{attrs.set(key,value);}} as unknown as HTMLCanvasElement;
  const requests:{frame:number;lang:string;scenario:string}[]=[];
  const asset:P018CanvasAssetV1={
    metadata:{animationId:P018_TIMELINE.animationId,
      sourceSwfSha256:P018_TIMELINE.sourceSwfSha256,stage:P018_TIMELINE.stage,
      fps:12,deterministicContentTimeline:{timelineId:'sprite-32',frameCount:648}},
    ready:async()=>undefined,
    render:(target,request)=>{
      assert.equal(target,canvas);requests.push(request);
      target.setAttribute('data-flash-frame',String(request.frame));
      target.setAttribute('data-flash-frame-domain','sprite-32');
      target.setAttribute('data-flash-root-frame','6');
      return {localFrame:request.frame,frameDomain:'sprite-32',rootFrame:6};
    },
  };
  return {canvas,asset,requests};
}
function sourceTrigger(instanceId:string,buttonId:number,key:string){
  const values=new Map([['data-source-button-instance-id',instanceId],
    ['data-source-button-id',String(buttonId)],['data-p018-glossary-key',key]]);
  const trigger={isConnected:true,disabled:false,
    getAttribute:(name:string)=>values.get(name)??null} as unknown as HTMLButtonElement;
  const scope={contains:(candidate:unknown)=>candidate===trigger} as HTMLElement;
  return {trigger,scope,values};
}

test('P018 verifies Canvas identity and committed source frame, including final 648',()=>{
  const f=canvasFixture();
  for(const frame of [1,11,18,43,65,102,324,333,382,648])
    p018PaintVerifiedFrame(f.asset,f.canvas,frame);
  assert.deepEqual(f.requests.map(x=>x.frame),[1,11,18,43,65,102,324,333,382,648]);
  assert(f.requests.every(x=>x.lang==='en'&&x.scenario==='source-static-frame'));
  assert.equal(f.canvas.getAttribute('data-flash-frame'),'648');
  assert.throws(()=>p018PaintVerifiedFrame(f.asset,f.canvas,649),/P018_INVALID_MAIN_FRAME/u);
  assert.throws(()=>p018PaintVerifiedFrame({...f.asset,metadata:{...f.asset.metadata,
    sourceSwfSha256:'wrong'}},f.canvas,65),/P018_CANVAS_ASSET_IDENTITY_MISMATCH/u);
});

test('duplicate Evaluate and Function controls obey their own source instance gates',()=>{
  const firstEvaluate=sourceTrigger('sprite-32/depth-4/generation-1',8,'Evaluate');
  const lateEvaluate=sourceTrigger('sprite-32/depth-22/generation-1',8,'Evaluate');
  const firstFunction=sourceTrigger('sprite-32/depth-10/generation-1',11,'Function');
  const lateFunction=sourceTrigger('sprite-32/depth-24/generation-1',11,'Function');
  assert(!p018CanOpenGlossary('Evaluate',firstEvaluate.trigger,10,firstEvaluate.scope));
  assert(p018CanOpenGlossary('Evaluate',firstEvaluate.trigger,11,firstEvaluate.scope));
  assert(!p018CanOpenGlossary('Evaluate',lateEvaluate.trigger,323,lateEvaluate.scope));
  assert(p018CanOpenGlossary('Evaluate',lateEvaluate.trigger,324,lateEvaluate.scope));
  assert(!p018CanOpenGlossary('Function',firstFunction.trigger,17,firstFunction.scope));
  assert(p018CanOpenGlossary('Function',firstFunction.trigger,18,firstFunction.scope));
  assert(!p018CanOpenGlossary('Function',lateFunction.trigger,332,lateFunction.scope));
  assert(p018CanOpenGlossary('Function',lateFunction.trigger,333,lateFunction.scope));
  assert(!p018CanOpenGlossary('Function',lateEvaluate.trigger,648,lateEvaluate.scope));
  assert(!p018CanOpenGlossary('Evaluate',lateEvaluate.trigger,324,firstEvaluate.scope));
  lateEvaluate.values.set('data-source-button-id','11');
  assert(!p018CanOpenGlossary('Evaluate',lateEvaluate.trigger,324,lateEvaluate.scope));
});

test('native rendered controls bind the second source instances only at their own gates',()=>{
  for(const [frame,count,last] of [[323,5,'sprite-32/depth-16/generation-1'],
    [324,6,'sprite-32/depth-22/generation-1'],
    [332,6,'sprite-32/depth-22/generation-1'],
    [333,7,'sprite-32/depth-24/generation-1']] as const){
    const html=renderToStaticMarkup(<P018NativeTextV1 frame={frame}/>);
    const rendered=[...html.matchAll(/<button\b[^>]*data-p018-glossary-key="([^"]+)"[^>]*data-source-button-id="([^"]+)"[^>]*data-source-button-instance-id="([^"]+)"/gu)];
    assert.equal(rendered.length,count,`frame ${frame}`);
    assert.equal(rendered.at(-1)?.[3],last,`frame ${frame}`);
    for(const [,key,id,instance] of rendered){
      const {trigger,scope}=sourceTrigger(instance,Number(id),key);
      assert(p018CanOpenGlossary(key as Parameters<typeof p018CanOpenGlossary>[0],
        trigger,frame,scope),`${key} ${instance} at ${frame}`);
    }
  }
});

test('Spanish locale and reduced motion never start main or optional SA during render',()=>{
  const f=canvasFixture();let mainLoads=0,saLoads=0;
  const html=renderToStaticMarkup(<P018PlayerV1 asset={f.asset}
    loadAudio={async()=>{mainLoads++;return new ArrayBuffer(0);}}
    loadSpanishAudio={async()=>{saLoads++;return new ArrayBuffer(0);}}
    language="es" reducedMotion onOpenGlossary={()=>{}}/>);
  assert.equal(mainLoads,0);assert.equal(saLoads,0);
  assert.match(html,/data-p018-player-phase="loading"/u);
  assert.match(html,/data-p018-audio-owner="main"/u);
  assert.match(html,/data-p018-sa-phase="idle"/u);
  assert.match(html,/data-p018-motion-policy="explicit-reduced"/u);
  assert.match(html,/Audio en español/u);
  assert.match(html,/<canvas[^>]*aria-hidden="true"/u);
});
