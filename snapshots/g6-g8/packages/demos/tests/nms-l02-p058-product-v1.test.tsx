import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../src/contract';
import {p058SemanticSnapshot} from '../src/nms-l02-p058-semantic-v1';
import {p058ProductTextSnapshotV1} from '../src/nms-l02-p058-product-text-v1';
import {p058ProductFrameState,nmsL02P058ProductModule} from '../src/nms-l02-p058-product-module-v1';
import {NmsL02P058ProductRendererV1} from '../src/nms-l02-p058-product-renderer-v1';
const ctx=(frame:number):RuntimeContext=>({frame,frameDomain:'sprite-37',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0});
const markup=(frame:number)=>renderToStaticMarkup(<NmsL02P058ProductRendererV1 {...ctx(frame)} uiLanguage="es"/>);

test('all 274 source frames map to deterministic product state and source-bound text',()=>{
 for(let frame=1;frame<=274;frame++){
  const context=ctx(frame),state=p058ProductFrameState(frame,context);
  assert.equal(state.status,'ready');assert.deepEqual(state,p058ProductFrameState(frame,context));
  const text=p058ProductTextSnapshotV1(context);assert.equal(text.status,'ready');
  assert.equal(state.semantic?.flashActive,[242,244,246].includes(frame));
 }
});
test('source fade and movement are presented without disclosing future text or adding CSS choreography',()=>{
 assert.doesNotMatch(markup(12),/4 Check your answer\./u);
 const transition=markup(17),pose=p058SemanticSnapshot(17).heading17;
 assert.match(transition,/4 Check your answer\./u);
 assert.match(transition,/aria-hidden="true"/u);
 assert(transition.includes(`translate(${(pose.relativeToFinalTwips?.x??0)/20}px, ${(pose.relativeToFinalTwips?.y??0)/20}px)`));
 assert.match(transition,/transition:none/u);assert.doesNotMatch(transition,/animation:/u);
 assert.doesNotMatch(markup(139),/write an equation|work backwards/u);
 assert.match(markup(146),/write an equation and solve it/u);
 assert.doesNotMatch(markup(237),/Show<\/span> your work/u);
 assert.match(markup(242),/data-source-show-flash="true"/u);
 assert.match(markup(243),/data-source-show-flash="false"/u);
 assert.match(markup(274),/Show<\/span> your work\./u);
 assert.match(markup(274),/data-source-text-id="15"[^>]*>Check your answer\./u);
});
test('unsupported frame/domain/language identities stay blocked while Spanish host discloses English source',()=>{
 for(const bad of [{frame:0},{frame:275},{frame:1.5},{frameDomain:'root'},{rootFrame:5},{seed:1},{lang:'es'},{scenario:'invented'},{replay:-1}] as const){
  const context={...ctx(1),...bad} as RuntimeContext;
  assert.equal(p058ProductTextSnapshotV1(context).status,'blocked');
  assert.equal(p058ProductFrameState(context.frame,context).status,'blocked');
 }
 assert.match(markup(274),/Texto original en inglés/u);
 assert.match(markup(274),/data-canvas-status="ready"/u);
});
test('Replay resets all semantic state; root and child clocks and terminal policy remain separate',()=>{
 assert.deepEqual(p058ProductFrameState(1,{...ctx(1),replay:1}),p058ProductFrameState(1,ctx(1)));
 assert.equal(p058ProductFrameState(1,ctx(1)).semantic?.availableControlIds.length,0);
 assert.equal(nmsL02P058ProductModule.runtime?.frameCount,10);
 assert.equal(nmsL02P058ProductModule.movie.frameCount,274);
 assert.equal(nmsL02P058ProductModule.playbackMode,'once');
 assert.equal(nmsL02P058ProductModule.playbackEndFrameByDomain?.['sprite-37'],274);
 assert.equal(p058ProductFrameState(274,ctx(274)).sourceTerminalStopPresent,false);
 assert.equal(p058ProductFrameState(242,ctx(242)).semantic?.availableControlIds.length,7);
 assert.equal(p058ProductFrameState(274,ctx(274)).semantic?.availableControlIds.length,6);
});
