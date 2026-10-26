import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../src/contract';
import {P060_CANONICAL_TIMELINE} from '../src/timelines/shared-nms002-l02-p060';
import canonical from '../src/modules/shared-nms002-l02-p060';
import {P060_PRODUCT_SCENARIO,nmsL02P060ProductModule,p060ProductFrameState} from '../src/nms-l02-p060-product-module-v1';

const context=(frame:number,overrides:Partial<RuntimeContext>={}):RuntimeContext=>({
 frame,frameDomain:'sprite-391',rootFrame:6,scenario:P060_PRODUCT_SCENARIO,lang:'en',seed:0,replay:0,...overrides,
});
const render=(frame:number,overrides:Record<string,unknown>={})=>renderToStaticMarkup(
 <canonical.Renderer {...context(frame)} uiLanguage="en" {...overrides}/>);

test('canonical P060 module binds source root, teaching sprite and authored stop',()=>{
 assert.equal(canonical,nmsL02P060ProductModule);
 assert.equal(canonical.key,'shared-nms002-l02-p060');
 assert.deepEqual(canonical.movie.stage,{width:800,height:600});
 assert.equal(canonical.movie.fps,12);
 assert.equal(canonical.movie.frameCount,721);
 assert.equal(canonical.runtime?.frameCount,10);
 assert.equal(canonical.runtime?.defaultFrameDomain,'sprite-391');
 assert.deepEqual(canonical.playbackEndFrameByDomain,{root:1,'sprite-391':718});
 assert.equal(canonical.audioCues.length,0);
 assert.deepEqual(P060_CANONICAL_TIMELINE.sourceStops,[262,400,527,646,699,718]);
});

test('source introspection spans 1..721, while normal presentation ends at 718',()=>{
 const first=p060ProductFrameState(1,context(1)),terminal=p060ProductFrameState(718,context(718));
 const trailing=p060ProductFrameState(721,context(721));
 assert.equal(first.status,'ready');assert.equal(first.visualStatus,'renderable');
 assert.equal(first.source?.sourceStop,false);assert(first.sourceObjects?.some(item=>item.characterId===17));
 assert.equal(terminal.source?.sourceStop,true);assert.equal(terminal.visualStatus,'renderable');
 assert.equal(trailing.status,'ready');assert.equal(trailing.visualStatus,'blocked-after-authored-stop');
 assert(trailing.sourceObjects?.length);
 assert.match(render(1),/data-p060-main-frame="1"/);
 assert.match(render(718),/data-source-terminal-frame="718"/);
 assert.match(render(719),/data-p060-inspector-status="blocked"/);
});

test('invalid runtime domain, root, scenario and source language fail closed',()=>{
 for(const override of [{frameDomain:'root'},{rootFrame:5},{scenario:'quiz'},{lang:'es'},{seed:1}]){
  assert.equal(p060ProductFrameState(699,context(699,override)).status,'blocked');
  assert.match(render(699,override),/data-p060-inspector-status="blocked"/);
 }
 assert.match(render(699,{uiLanguage:'es'}),/Texto original en inglés/);
 assert.equal(p060ProductFrameState(0,context(0)).status,'blocked');
 assert.equal(p060ProductFrameState(722,context(722)).status,'blocked');
});
