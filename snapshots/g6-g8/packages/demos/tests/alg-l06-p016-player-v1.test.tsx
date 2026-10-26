import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P016PlayerV1,p016PaintVerifiedFrame,type P016CanvasAssetV1}
  from '../src/alg-l06-p016-player-v1';
import {P016_TIMELINE} from '../src/alg-l06-p016-timeline-v1';

function fixture(){
  const attrs=new Map<string,string>();
  const canvas={width:800,height:600,getAttribute:(key:string)=>attrs.get(key)??null,
    setAttribute:(key:string,value:string)=>{attrs.set(key,value);}} as unknown as HTMLCanvasElement;
  const requests:{frame:number;lang:string;scenario:string}[]=[];
  const asset:P016CanvasAssetV1={
    metadata:{animationId:P016_TIMELINE.animationId,
      sourceSwfSha256:P016_TIMELINE.sourceSwfSha256,stage:P016_TIMELINE.stage,
      fps:12,deterministicContentTimeline:{timelineId:'sprite-139',frameCount:815}},
    ready:async()=>undefined,
    render:(target,request)=>{
      assert.equal(target,canvas);requests.push(request);
      target.setAttribute('data-flash-frame',String(request.frame));
      target.setAttribute('data-flash-frame-domain','sprite-139');
      target.setAttribute('data-flash-root-frame','6');
      return {localFrame:request.frame,frameDomain:'sprite-139',rootFrame:6};
    },
  };
  return {canvas,asset,requests};
}

test('P016 verifies first, Function, final and audio-tail-held Canvas frames',()=>{
  const f=fixture();
  for(const frame of [1,72,121,421,472,614,815])
    p016PaintVerifiedFrame(f.asset,f.canvas,frame);
  assert.deepEqual(f.requests.map(row=>row.frame),[1,72,121,421,472,614,815]);
  assert(f.requests.every(row=>row.lang==='en'&&row.scenario==='source-static-frame'));
  assert.equal(f.canvas.getAttribute('data-flash-frame'),'815');
});

test('P016 rejects a foreign asset or false committed frame',()=>{
  const f=fixture();
  assert.throws(()=>p016PaintVerifiedFrame({...f.asset,metadata:{...f.asset.metadata,
    sourceSwfSha256:'different'}},f.canvas,172),/P016_CANVAS_ASSET_IDENTITY_MISMATCH/u);
  assert.throws(()=>p016PaintVerifiedFrame(f.asset,f.canvas,816),/P016_INVALID_MAIN_FRAME/u);
  const lying={...f.asset,render:(canvas:HTMLCanvasElement,request:{frame:number;
    scenario:'source-static-frame';lang:'en';seed:0})=>{
      f.asset.render(canvas,request);return {localFrame:request.frame+1,
        frameDomain:'sprite-139',rootFrame:6};}};
  assert.throws(()=>p016PaintVerifiedFrame(lying,f.canvas,317),
    /P016_CANVAS_FRAME_COMMIT_MISMATCH/u);
});

test('Spanish UI and reduced motion do not load two main assets or optional SA on render',()=>{
  const f=fixture();let mainLoads=0,saLoads=0;
  const html=renderToStaticMarkup(<P016PlayerV1 asset={f.asset}
    loadAudio={async()=>{mainLoads++;return new ArrayBuffer(0);}}
    loadSpanishAudio={async()=>{saLoads++;return new ArrayBuffer(0);}}
    language="es" reducedMotion onOpenGlossary={()=>{}}/>);
  assert.equal(mainLoads,0);assert.equal(saLoads,0);
  assert.match(html,/data-p016-player-phase="loading"/u);
  assert.match(html,/data-p016-audio-owner="main"/u);
  assert.match(html,/data-p016-sa-phase="idle"/u);
  assert.match(html,/data-p016-motion-policy="explicit-reduced"/u);
  assert.match(html,/Audio en español/u);
  assert.match(html,/<canvas[^>]*aria-hidden="true"/u);
});
