import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P015PlayerV1,p015PaintVerifiedFrame,type P015CanvasAssetV1}
  from '../src/alg-l06-p015-player-v1';
import {P015_TIMELINE} from '../src/alg-l06-p015-timeline-v1';

function fixture(){
  const attrs=new Map<string,string>();
  const canvas={width:800,height:600,getAttribute:(key:string)=>attrs.get(key)??null,
    setAttribute:(key:string,value:string)=>{attrs.set(key,value);}} as unknown as HTMLCanvasElement;
  const requests:{frame:number;lang:string;scenario:string}[]=[];
  const asset:P015CanvasAssetV1={
    metadata:{animationId:P015_TIMELINE.animationId,
      sourceSwfSha256:P015_TIMELINE.sourceSwfSha256,stage:P015_TIMELINE.stage,
      fps:12,deterministicContentTimeline:{timelineId:'sprite-270',frameCount:914}},
    ready:async()=>undefined,
    render:(target,request)=>{
      assert.equal(target,canvas);requests.push(request);
      target.setAttribute('data-flash-frame',String(request.frame));
      target.setAttribute('data-flash-frame-domain','sprite-270');
      target.setAttribute('data-flash-root-frame','6');
      return {localFrame:request.frame,frameDomain:'sprite-270',rootFrame:6};
    },
  };
  return {canvas,asset,requests};
}

test('P015 verifies first, six-word, final and audio-tail-held Canvas frames',()=>{
  const f=fixture();
  for(const frame of [1,172,191,215,302,317,332,914])
    p015PaintVerifiedFrame(f.asset,f.canvas,frame);
  assert.deepEqual(f.requests.map(row=>row.frame),[1,172,191,215,302,317,332,914]);
  assert(f.requests.every(row=>row.lang==='en'&&row.scenario==='source-static-frame'));
  assert.equal(f.canvas.getAttribute('data-flash-frame'),'914');
});

test('P015 rejects a foreign asset or false committed frame',()=>{
  const f=fixture();
  assert.throws(()=>p015PaintVerifiedFrame({...f.asset,metadata:{...f.asset.metadata,
    sourceSwfSha256:'different'}},f.canvas,172),/P015_CANVAS_ASSET_IDENTITY_MISMATCH/u);
  assert.throws(()=>p015PaintVerifiedFrame(f.asset,f.canvas,915),/P015_INVALID_MAIN_FRAME/u);
  const lying={...f.asset,render:(canvas:HTMLCanvasElement,request:{frame:number;
    scenario:'source-static-frame';lang:'en';seed:0})=>{
      f.asset.render(canvas,request);return {localFrame:request.frame+1,
        frameDomain:'sprite-270',rootFrame:6};}};
  assert.throws(()=>p015PaintVerifiedFrame(lying,f.canvas,317),
    /P015_CANVAS_FRAME_COMMIT_MISMATCH/u);
});

test('Spanish UI and reduced motion do not load four main assets or optional SA on render',()=>{
  const f=fixture();let mainLoads=0,saLoads=0;
  const html=renderToStaticMarkup(<P015PlayerV1 asset={f.asset}
    loadAudio={async()=>{mainLoads++;return new ArrayBuffer(0);}}
    loadSpanishAudio={async()=>{saLoads++;return new ArrayBuffer(0);}}
    language="es" reducedMotion onOpenGlossary={()=>{}}/>);
  assert.equal(mainLoads,0);assert.equal(saLoads,0);
  assert.match(html,/data-p015-player-phase="loading"/u);
  assert.match(html,/data-p015-audio-owner="main"/u);
  assert.match(html,/data-p015-sa-phase="idle"/u);
  assert.match(html,/data-p015-motion-policy="explicit-reduced"/u);
  assert.match(html,/Audio en español/u);
  assert.match(html,/<canvas[^>]*aria-hidden="true"/u);
});
