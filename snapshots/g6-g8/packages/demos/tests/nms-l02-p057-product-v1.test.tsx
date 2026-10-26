import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../src/contract';
import {P057_CONTROLS,p057SemanticSnapshot} from '../src/nms-l02-p057-semantic-v1';
import {p057ProductTextSnapshotV1} from '../src/nms-l02-p057-product-text-v1';
import {p057ProductFrameState,nmsL02P057ProductModule} from '../src/nms-l02-p057-product-module-v1';
import {NmsL02P057ProductRendererV1} from '../src/nms-l02-p057-product-renderer-v1';
import {sourceGlossaryControlsAtFrame} from '../src/source-glossary-controls';
const ctx=(frame:number):RuntimeContext=>({frame,frameDomain:'sprite-66',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0});

test('all 328 source frames have deterministic semantic state and exact full-opacity controls',()=>{
 for(let frame=1;frame<=328;frame++){
  const state=p057SemanticSnapshot(frame);assert.deepEqual(state,p057SemanticSnapshot(frame));
  assert.deepEqual(state.availableControlIds,sourceGlossaryControlsAtFrame(P057_CONTROLS,frame,'sprite-66').map(row=>row.id));
  assert.equal(state.highlightedTerm,[34,36,38].includes(frame)?'Solve':[42,44,46].includes(frame)?'Problem':null);
  assert.equal(p057ProductFrameState(frame,ctx(frame)).status,'ready');
  assert.equal(p057ProductTextSnapshotV1(ctx(frame)).status,'ready');
 }
 for(const [frame,count] of [[11,0],[12,2],[76,2],[77,3],[102,3],[103,7],[328,7]])
  assert.equal(p057SemanticSnapshot(frame).availableControlIds.length,count);
});
test('source reveal boundaries preserve fades and never disclose a later strategy or prompt early',()=>{
 const groups=[['headingAlpha',5,12],['strategiesHeadingAlpha',67,77],['leftStrategiesAlpha',97,103],
  ['rightStrategiesAlpha',97,103],['finalPromptAlpha',266,275]] as const;
 for(const [field,first,full] of groups){
  assert.equal(p057SemanticSnapshot(first-1)[field],0);assert.equal(p057SemanticSnapshot(first)[field],0);
  assert(p057SemanticSnapshot(first+1)[field]>0&&p057SemanticSnapshot(first+1)[field]<1);
  assert.equal(p057SemanticSnapshot(full)[field],1);assert.equal(p057SemanticSnapshot(328)[field],1);
 }
 assert.equal(p057SemanticSnapshot(96).sourceGlyphCount,0);assert.equal(p057SemanticSnapshot(97).sourceGlyphCount,79);
});
test('unsupported identity and Spanish source requests stay blocked; UI Spanish uses English source disclosure',()=>{
 for(const bad of [{frame:0},{frame:329},{frame:1.5},{frameDomain:'root'},{rootFrame:5},{seed:1},{lang:'es'},{scenario:'invented'},{replay:-1}] as const){
  const context={...ctx(1),...bad} as RuntimeContext;
  assert.equal(p057ProductTextSnapshotV1(context).status,'blocked');
  assert.equal(p057ProductFrameState(context.frame,context).status,'blocked');
 }
 const before=renderToStaticMarkup(<NmsL02P057ProductRendererV1 {...ctx(97)} uiLanguage="es"/>);
 assert.match(before,/Texto original en inglés/u);assert.doesNotMatch(before,/write an equation|Circle your answer/u);
 const terminal=renderToStaticMarkup(<NmsL02P057ProductRendererV1 {...ctx(328)} uiLanguage="es"/>);
 assert.match(terminal,/write an equation and solve it/u);assert.match(terminal,/Circle your answer/u);
 assert.match(terminal,/data-canvas-status="ready"/u);
});
test('Replay reconstructs initial state and terminal hold remains an explicit product policy',()=>{
 const initial=p057ProductFrameState(1,ctx(1));
 assert.deepEqual(p057ProductFrameState(1,{...ctx(1),replay:1}),initial);
 assert.equal(initial.semantic?.availableControlIds.length,0);
 assert.equal(nmsL02P057ProductModule.playbackMode,'once');
 assert.equal(nmsL02P057ProductModule.playbackEndFrameByDomain?.['sprite-66'],328);
 assert.equal(nmsL02P057ProductModule.runtime?.frameCount,10);
 assert.equal(p057ProductFrameState(328,ctx(328)).sourceTerminalStopPresent,false);
});
