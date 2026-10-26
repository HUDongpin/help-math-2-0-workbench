import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../src/contract';
import {P062_CANONICAL_TIMELINE} from '../src/timelines/shared-nms002-l02-p062';
import canonical from '../src/modules/shared-nms002-l02-p062';
import {P062_PRODUCT_SCENARIO,nmsL02P062ProductModule,p062ProductFrameState} from '../src/nms-l02-p062-product-module-v1';

const context=(frame:number,overrides:Partial<RuntimeContext>={}):RuntimeContext=>({
 frame,frameDomain:'sprite-315',rootFrame:6,scenario:P062_PRODUCT_SCENARIO,lang:'en',seed:0,replay:0,...overrides,
});
const render=(frame:number,overrides:Record<string,unknown>={})=>renderToStaticMarkup(
 <canonical.Renderer {...context(frame)} uiLanguage="en" {...overrides}/>);

test('canonical P062 module binds the source domain, stop path and no glossary controls',()=>{
 assert.equal(canonical,nmsL02P062ProductModule);
 assert.equal(canonical.key,'shared-nms002-l02-p062');
 assert.deepEqual(canonical.movie.stage,{width:800,height:600});
 assert.equal(canonical.movie.fps,12);
 assert.equal(canonical.movie.frameCount,837);
 assert.equal(canonical.runtime?.frameCount,10);
 assert.equal(canonical.runtime?.defaultFrameDomain,'sprite-315');
 assert.deepEqual(canonical.playbackEndFrameByDomain,{root:1,'sprite-315':834});
 assert.equal(canonical.audioCues.length,0);
 assert.deepEqual(P062_CANONICAL_TIMELINE.sourceStops,[384,523,650,766,815,834]);
 assert.equal(P062_CANONICAL_TIMELINE.glossary.sourceControlCount,0);
 assert.equal(P062_CANONICAL_TIMELINE.glossary.sourceKeyAttributeControlsPresent,false);
 assert.deepEqual(P062_CANONICAL_TIMELINE.editorialCorrections,['tax-base','example-rate']);
});

test('all 837 source frames are introspectable while normal presentation ends at 834',()=>{
 const first=p062ProductFrameState(1,context(1)),terminal=p062ProductFrameState(834,context(834));
 const trailing=p062ProductFrameState(837,context(837));
 assert.equal(first.status,'ready');assert.equal(first.visualStatus,'renderable');
 assert.equal(first.source?.sourceStop,false);
 assert.equal(first.sourceGlossaryControlsPresent,false);
 assert.equal(terminal.source?.sourceStop,true);assert.equal(terminal.visualStatus,'renderable');
 assert.equal(trailing.status,'ready');assert.equal(trailing.visualStatus,'blocked-after-authored-stop');
 assert(Array.isArray(trailing.sourceObjects));
 assert.match(render(10),/data-p062-main-frame="10"/);
 assert.match(render(834),/data-source-terminal-frame="834"/);
 assert.match(render(835),/data-p062-inspector-status="blocked"/);
});

test('invalid source context fails closed; Spanish remains an English-source fallback',()=>{
 for(const override of [{frameDomain:'root'},{rootFrame:5},{scenario:'quiz'},{lang:'es'},{seed:1}]){
  assert.equal(p062ProductFrameState(815,context(815,override)).status,'blocked');
  assert.match(render(815,override),/data-p062-inspector-status="blocked"/);
 }
 assert.match(render(815,{uiLanguage:'es'}),/Texto original en inglés/);
 assert.doesNotMatch(render(815),/data-source-key-attribute|data-glossary-entry-id/);
 assert.equal(p062ProductFrameState(0,context(0)).status,'blocked');
 assert.equal(p062ProductFrameState(838,context(838)).status,'blocked');
});
