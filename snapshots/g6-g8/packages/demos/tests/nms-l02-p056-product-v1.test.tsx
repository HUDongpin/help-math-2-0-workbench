import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {nmsL02P056ProductModule,p056ProductFrameState,P056_PRODUCT_SOURCE_AUDIO} from '../src/nms-l02-p056-product-module-v1';
import {NmsL02P056ProductRendererV1} from '../src/nms-l02-p056-product-renderer-v1';
import {p056ProductTextSnapshotV1} from '../src/nms-l02-p056-product-text-v1';
import {p056SourceSpriteFrame} from '../src/timelines/shared-nms002-l02-p056-display-list';

const request=(frame:number,extra:Record<string,unknown>={})=>({frame,frameDomain:'sprite-24',rootFrame:6,
  scenario:'source-static-frame',lang:'en' as const,seed:0,replay:0,...extra});
const render=(frame:number,extra:Record<string,unknown>={})=>
  renderToStaticMarkup(<NmsL02P056ProductRendererV1 {...request(frame,extra)}/>);

test('product metadata separates 10-frame root from 234-frame source sprite',()=>{
  assert.equal(nmsL02P056ProductModule.key,'shared-nms002-l02-p056');
  assert.equal(nmsL02P056ProductModule.movie.frameCount,234);
  assert.equal(nmsL02P056ProductModule.runtime?.frameCount,10);
  assert.deepEqual(nmsL02P056ProductModule.runtime?.frameDomains,[{id:'sprite-24',frameCount:234,fps:12,rootFrame:6}]);
  assert.equal(nmsL02P056ProductModule.maturity,'legacy-prototype');
  assert.equal(nmsL02P056ProductModule.audioCues.length,0);
  assert.equal(nmsL02P056ProductModule.playbackEndFrameByDomain?.['sprite-24'],234);
  assert.equal(P056_PRODUCT_SOURCE_AUDIO.disposition,'private-source-evidence-not-product-asset');
  assert.equal(P056_PRODUCT_SOURCE_AUDIO.sha256,'6ab63ac96194356d22da4335ce4ff121964044fc5dab27cc79b33fa22e2fc811');
});

test('all 234 source frames are pure, queryable, and use the existing display-list layer count',()=>{
  for(let frame=1;frame<=234;frame++){
    const state=p056ProductFrameState(frame,request(frame));
    assert.equal(state.status,'ready');assert.equal(state.frame,frame);
    assert.equal(state.sourceLayerCount,p056SourceSpriteFrame(frame).length);
    assert.equal(state.sourceTerminalStopPresent,false);
    assert.equal(state.audioRendered,false);
    const text=p056ProductTextSnapshotV1(request(frame));
    assert.equal(text.status,'ready');assert.equal(text.identity.frame,frame);
    assert.equal(text.bindingVersion,'nms-l02-p056-source-semantic-product-v1');
  }
  assert.equal(p056ProductFrameState(9,request(9)).headingAlpha,0);
  assert.equal(p056ProductFrameState(10,request(10)).headingAlpha,32/256);
  assert.equal(p056ProductFrameState(16,request(16)).sourceButtonsFullyOpaque,false);
  assert.equal(p056ProductFrameState(17,request(17)).sourceButtonsFullyOpaque,true);
  assert.equal(p056ProductFrameState(32,request(32)).highlightedTerm,'Organize');
  assert.equal(p056ProductFrameState(42,request(42)).highlightedTerm,'Information');
  assert.equal(p056ProductFrameState(103,request(103)).haveQuestionAlpha,28/256);
  assert.equal(p056ProductFrameState(155,request(155)).needQuestionAlpha,28/256);
  assert.equal(p056ProductFrameState(234,request(234)).needQuestionAlpha,1);
});

test('invalid frame, domain, root, scenario, seed, and visual Spanish context fail closed',()=>{
  for(const [frame,extra] of [
    [0,{}],[235,{}],[1,{frameDomain:'sprite-26'}],[1,{rootFrame:5}],
    [1,{scenario:'unknown'}],[1,{seed:1}],[1,{lang:'es'}],[1,{replay:-1}],
  ] as const){
    assert.equal(p056ProductFrameState(frame,request(frame,extra)).status,'blocked');
    assert.equal(p056ProductTextSnapshotV1(request(frame,extra)).status,'blocked');
    assert.match(render(frame,extra),/data-canvas-status="error"/u);
  }
  assert.equal(p056ProductFrameState(1,request(1,{frameDomain:'root',scenario:'root-unavailable',rootFrame:1})).blocker,
    'root-baseline-unavailable');
  const blocked=nmsL02P056ProductModule.textPresentation?.getSnapshot(
    p056ProductFrameState(1,request(1,{seed:1})),request(1));
  assert.equal(blocked?.status,'blocked');
});

test('modern English source text, fades, flash and ES fallback use verified inline SVG without fake glossary links',()=>{
  const first=render(1);
  assert.match(first,/data-canvas-status="ready"/u);
  assert.match(first,/Restate the question\./u);
  assert.match(first,/grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,20rem\),1fr\)\)/u);
  assert.doesNotMatch(first,/<h3/u);
  assert.doesNotMatch(first,/<button/u);
  const fade=render(10);
  assert.match(fade,/data-source-text-id="12 14" aria-hidden="true" style="opacity:0\.125/u);
  const flash=render(32);
  assert.match(flash,/data-source-key="Organize" style="background:#fbd8f5/u);
  const final=render(234,{uiLanguage:'es'});
  assert.match(final,/data-language-policy="english-source-fallback"/u);
  assert.match(final,/data-spanish-translation="missing"/u);
  assert.match(final,/What information do I have\?/u);
  assert.match(final,/What information do I need\?/u);
  assert.match(final,/data-source-svg-projection="sprite-24" data-dynamic-text-11="unresolved"/u);
  assert.match(final,/viewBox="0 0 800 600"/u);
  assert.doesNotMatch(final,/¿Qué información necesito\?/u);
  assert.doesNotMatch(final,/<button/u);
});

test('two product renderer instances scope every inline source SVG symbol independently',()=>{
  const html=renderToStaticMarkup(<><NmsL02P056ProductRendererV1 {...request(32)}/>
    <NmsL02P056ProductRendererV1 {...request(42)}/></>);
  const ids=[...html.matchAll(/id="(P056Native[^"]+)"/gu)].map(match=>match[1]);
  assert.ok(ids.length>0);assert.equal(ids.length,new Set(ids).size);
});
