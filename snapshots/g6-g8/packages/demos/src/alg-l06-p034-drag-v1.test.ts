import assert from 'node:assert/strict';
import test from 'node:test';
import {p034StageToGraphX as sourceReviewedStageToGraphX}
 from '../../../output/alg-l06-p034-renderer-preparation-20261001-v1/p034-drag-projection-v1';
import {P034_ENGINEERING_INPUT,P034_GRAPH,p034CleanupDrag,p034ClientToStage,
  p034InitialDrag,p034Keyboard,p034PointerCancel,p034PointerDown,p034PointerEnd,
  p034PointerMove,p034StageToGraph,p034SyncDrag} from './alg-l06-p034-drag-v1';

test('source placement transform is reused while hit and travel policy remain explicit',()=>{
  const local=p034StageToGraph(P034_GRAPH.stageX+21*P034_GRAPH.scale,
    P034_GRAPH.stageY+10*P034_GRAPH.scale);
  assert.deepEqual(local,{x:21,y:10});
  assert.equal(local.x,sourceReviewedStageToGraphX(P034_GRAPH.stageX+21*P034_GRAPH.scale,
    {stageX:P034_GRAPH.stageX,stageY:P034_GRAPH.stageY,scale:P034_GRAPH.scale,
      clipX:-27.2,measuredClipWidth:185.6}));
  assert.equal(P034_ENGINEERING_INPUT.provenance,
    'modern-engineering-range-not-original-runtime');
  assert.deepEqual(P034_ENGINEERING_INPUT.lineLocal,{left:-70,right:70});
  assert.deepEqual(p034ClientToStage(250,125,{left:50,top:25,width:400,height:300}),
    {x:400,y:200});
  assert.throws(()=>p034ClientToStage(1,1,{left:0,top:0,width:0,height:300}));
});

test('graph is absent until 433; pointer capture has one owner and clamps travel',()=>{
  const before=p034InitialDrag(432);
  assert.equal(p034PointerDown(before,7,P034_GRAPH.stageX,P034_GRAPH.stageY),before);
  let held=p034SyncDrag(before,433,0);
  assert.equal(p034PointerDown(held,7,P034_GRAPH.stageX+100,P034_GRAPH.stageY),held,
    'outside engineering hit rectangle');
  held=p034PointerDown(held,7,P034_GRAPH.stageX,P034_GRAPH.stageY);
  assert.equal(held.visible,true);assert.equal(held.pointerId,7);
  assert.equal(p034PointerDown(held,8,P034_GRAPH.stageX,P034_GRAPH.stageY),held);
  assert.equal(p034PointerMove(held,8,P034_GRAPH.stageX+500),held);
  held=p034PointerMove(held,7,P034_GRAPH.stageX+500);
  assert.equal(held.xGraphLocalPixels,70);
  held=p034PointerEnd(held,7);
  assert.equal(held.pointerId,null);assert.equal(held.visible,true);
  assert.equal(p034PointerMove(held,7,P034_GRAPH.stageX),held);
});

test('cancel, frame regression, Replay and cleanup retire stale drag state',()=>{
  let state=p034PointerDown(p034InitialDrag(433),4,P034_GRAPH.stageX,P034_GRAPH.stageY);
  state=p034PointerCancel(state,4);
  assert.equal(state.pointerId,null);assert.equal(state.visible,true);
  assert.equal(p034SyncDrag(state,434,0).visible,true,'graph persists one frame');
  state=p034SyncDrag(state,432,0);
  assert.equal(state.visible,false);assert.equal(state.xGraphLocalPixels,0.2);
  state=p034PointerDown(p034SyncDrag(state,433,0),5,P034_GRAPH.stageX,P034_GRAPH.stageY);
  state=p034SyncDrag(state,433,1);
  assert.equal(state.visible,false);assert.equal(state.pointerId,null);
  assert.deepEqual(p034CleanupDrag(p034Keyboard(state,'End')),p034InitialDrag(433,1));
});

test('keyboard path exposes source line through explicit modern controls',()=>{
  let state=p034InitialDrag(433);
  state=p034Keyboard(state,'ArrowRight');
  assert.equal(state.visible,true);assert.equal(state.xGraphLocalPixels,5.2);
  state=p034Keyboard(state,'Home');assert.equal(state.xGraphLocalPixels,-70);
  state=p034Keyboard(state,'ArrowLeft');assert.equal(state.xGraphLocalPixels,-70);
  state=p034Keyboard(state,'End');assert.equal(state.xGraphLocalPixels,70);
  state=p034Keyboard(state,'Escape');assert.equal(state.visible,false);
  state=p034Keyboard(state,'Enter');assert.equal(state.visible,true);
  assert.deepEqual(p034Keyboard(p034InitialDrag(432),'ArrowRight'),p034InitialDrag(432));
});
