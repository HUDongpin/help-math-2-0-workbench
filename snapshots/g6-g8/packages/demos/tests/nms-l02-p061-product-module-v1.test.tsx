import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../src/contract';
import {P061_CANONICAL_TIMELINE} from '../src/timelines/shared-nms002-l02-p061';
import canonical from '../src/modules/shared-nms002-l02-p061';
import {P061_PRODUCT_SCENARIO,nmsL02P061ProductModule,p061ProductFrameState} from '../src/nms-l02-p061-product-module-v1';

const context=(frame:number,overrides:Partial<RuntimeContext>={}):RuntimeContext=>({
 frame,frameDomain:'sprite-315',rootFrame:6,scenario:P061_PRODUCT_SCENARIO,lang:'en',seed:0,replay:0,...overrides,
});
const render=(frame:number,overrides:Record<string,unknown>={})=>renderToStaticMarkup(
 <canonical.Renderer {...context(frame)} uiLanguage="en" {...overrides}/>);

test('canonical P061 module binds source root, teaching sprite and authored stop',()=>{
 assert.equal(canonical,nmsL02P061ProductModule);
 assert.equal(canonical.key,'shared-nms002-l02-p061');
 assert.deepEqual(canonical.movie.stage,{width:800,height:600});
 assert.equal(canonical.movie.fps,12);
 assert.equal(canonical.movie.frameCount,882);
 assert.equal(canonical.runtime?.frameCount,10);
 assert.equal(canonical.runtime?.defaultFrameDomain,'sprite-315');
 assert.deepEqual(canonical.playbackEndFrameByDomain,{root:1,'sprite-315':879});
 assert.equal(canonical.audioCues.length,0);
 assert.deepEqual(P061_CANONICAL_TIMELINE.sourceStops,[435,573,700,817,860,879]);
});

test('source introspection spans 1..882, while normal presentation ends at 879',()=>{
 const first=p061ProductFrameState(1,context(1)),terminal=p061ProductFrameState(879,context(879));
 const trailing=p061ProductFrameState(882,context(882));
 assert.equal(first.status,'ready');assert.equal(first.visualStatus,'renderable');
 assert.equal(first.source?.sourceStop,false);assert(first.sourceObjects?.some(item=>item.characterId===17));
 assert.equal(terminal.source?.sourceStop,true);assert.equal(terminal.visualStatus,'renderable');
 assert.equal(trailing.status,'ready');assert.equal(trailing.visualStatus,'blocked-after-authored-stop');
 assert(trailing.sourceObjects?.length);
 assert.match(render(1),/data-p061-main-frame="1"/);
 assert.match(render(879),/data-source-terminal-frame="879"/);
 assert.match(render(880),/data-p061-inspector-status="blocked"/);
});

test('invalid runtime domain, root, scenario and source language fail closed',()=>{
 for(const override of [{frameDomain:'root'},{rootFrame:5},{scenario:'quiz'},{lang:'es'},{seed:1}]){
  assert.equal(p061ProductFrameState(860,context(860,override)).status,'blocked');
  assert.match(render(860,override),/data-p061-inspector-status="blocked"/);
 }
 assert.match(render(860,{uiLanguage:'es'}),/Texto original en inglés/);
 assert.equal(p061ProductFrameState(0,context(0)).status,'blocked');
 assert.equal(p061ProductFrameState(883,context(883)).status,'blocked');
});
