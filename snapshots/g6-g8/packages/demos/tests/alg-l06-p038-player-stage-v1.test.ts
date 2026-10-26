import assert from 'node:assert/strict';
import test from 'node:test';
import canvasMeta from '../../../migrations/shared-alg001-l06-p038/canvas-v1/canvas-metadata-v1.json';
import {p038PaintVerifiedFrame,type P038CanvasAssetV1,
  type P038CanvasResult} from '../src/alg-l06-p038-player-v1';

function fixture(){
  const attributes=new Map<string,string>();let renders=0;
  const canvas={width:800,height:600,
    getAttribute:(key:string)=>attributes.get(key)??null,
    setAttribute:(key:string,value:string)=>{attributes.set(key,value);},
  } as unknown as HTMLCanvasElement;
  const metadata={animationId:canvasMeta.animationId,
    sourceSwfSha256:canvasMeta.sourceSwfSha256,
    stage:canvasMeta.stage,fps:canvasMeta.fps,
    sourceRootTimeline:{beginFrame:6},
    deterministicContentTimeline:{timelineId:'sprite-67',frameCount:409},
    generatorInput:{framesHtmlSha256:
      '3d7114597b6332e987f31d35336c723a7b4afe385c3df08d8929ef646e66ea35'},
    audioRendering:'not-included'};
  const state=(frame:number):P038CanvasResult=>({localFrame:frame,
    frameDomain:'sprite-67',rootFrame:6,scenario:'source-static-frame',
    lang:'en',seed:0,audioRendered:false,suppressedSourceTextIds:[]});
  const asset:P038CanvasAssetV1={metadata,ready:async()=>{},
    resolveFrameState:request=>state(request.frame),
    render:(_canvas,request)=>{
      renders++;
      attributes.set('data-flash-frame',String(request.frame));
      attributes.set('data-flash-frame-domain','sprite-67');
      attributes.set('data-flash-root-frame','6');
      attributes.set('data-runtime-scenario','source-static-frame');
      attributes.set('data-runtime-seed','0');
      return state(request.frame);
    }};
  return {canvas,asset,attributes,get renders(){return renders;}};
}

test('initial frame one is drawn once across visual and runtime ACK',()=>{
  const f=fixture();
  const first=p038PaintVerifiedFrame(f.asset,f.canvas,1,0,null);
  const second=p038PaintVerifiedFrame(f.asset,f.canvas,1,0,first);
  assert.equal(second,first);assert.equal(f.renders,1);
  assert.equal(f.attributes.get('data-flash-frame'),'1');
});

test('Replay token permits frame one after progress while same-token rewind fails',()=>{
  const f=fixture();
  const first=p038PaintVerifiedFrame(f.asset,f.canvas,1,0,null);
  const progressed=p038PaintVerifiedFrame(f.asset,f.canvas,173,0,first);
  assert.throws(()=>p038PaintVerifiedFrame(f.asset,f.canvas,1,0,progressed),
    /P038_INVALID_FRAME_OR_REPLAY_TOKEN/);
  const replayed=p038PaintVerifiedFrame(f.asset,f.canvas,1,1,progressed);
  assert.deepEqual(replayed,{frame:1,token:1});assert.equal(f.renders,3);
});

test('wrong source asset and stale readback fail closed',()=>{
  const f=fixture();
  const bad={...f.asset,metadata:{...f.asset.metadata,sourceSwfSha256:'wrong'}};
  assert.throws(()=>p038PaintVerifiedFrame(bad,f.canvas,1,0,null),
    /P038_CANVAS_SOURCE_IDENTITY_MISMATCH/);
  const first=p038PaintVerifiedFrame(f.asset,f.canvas,1,0,null);
  f.attributes.set('data-flash-frame-domain','wrong');
  p038PaintVerifiedFrame(f.asset,f.canvas,1,0,first);
  assert.equal(f.renders,2);
});
