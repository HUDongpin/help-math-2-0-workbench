import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P053SourceScene,p053ReviewedScene} from '../src/nms-l02-p053-source-scene-v1';
import {P053_DISPLAY_DATA} from '../src/generated/nms-l02-p053-display-data-v1';
import type {P053NestedSnapshot} from '../src/nms-l02-p053-display-state-v1';
const flatten=(state:P053NestedSnapshot):P053NestedSnapshot['instances'][number][]=>
 state.instances.flatMap(p=>[p,...(p.child?flatten(p.child):[])]);

test('reviewed source projection supplies each child clock and holds main693',()=>{
 for(const frame of [1,6,7,174,221,277,436,492,535,586,615,693,694]){
  const scene=p053ReviewedScene({frame});const rows=flatten(scene);
  const main=rows.find(p=>p.characterId===187)!;
  assert.equal(main.child!.frame,Math.min(frame,693));
  for(const row of rows){
   if(row.child&&row.child.domainId!=='sprite-187')assert.equal(row.child.frame,1);
  }
 }
 const structural=flatten(p053ReviewedScene({frame:694,mode:'structural'}));
 assert.equal(structural.find(p=>p.characterId===187)!.child!.frame,694);
 assert(!structural.some(p=>p.name?.text==='Mc_Popup'));
 assert.throws(()=>p053ReviewedScene({frame:695}),/P053_FRAME_OUT_OF_DOMAIN/u);
 assert.throws(()=>p053ReviewedScene({frame:693,buttonFrames:{mcL1:0 as 1}}),/P053_BUTTON_FRAME/u);
 const selected=flatten(p053ReviewedScene({frame:693,buttonFrames:{mcL1:3,mcL2:1}}));
 assert.equal(selected.find(p=>p.name?.text==='mcL1')!.child!.frame,3);
 assert.equal(selected.find(p=>p.name?.text==='mcL2')!.child!.frame,1);
});

test('renderer uses source vectors plus native readable text and excludes unresolved field111',()=>{
 const rendered=renderToStaticMarkup(<P053SourceScene frame={586}/>);
 assert.match(rendered,/<text\b/u);
 assert.match(rendered,/Fractions, Decimals, and Percents Match Game\./u);
 assert.match(rendered,/data-p053-text-id="178"/u);
 assert.doesNotMatch(rendered,/data-p053-text-id="111"/u);
 assert.doesNotMatch(rendered,/<(?:image|foreignObject|script)\b/u);
 assert.match(rendered,/matrix\(1 0 0 1 412\.4 283\.3\)/u,'source root placement converts twips to px');
});

test('source clipDepth masks become isolated local clipPaths, not painted shapes',()=>{
 const rendered=renderToStaticMarkup(<P053SourceScene frame={615}/>);
 assert.equal((rendered.match(/<clipPath\b/gu)??[]).length,8);
 assert.equal((rendered.match(/clipPathUnits="userSpaceOnUse"/gu)??[]).length,8);
 assert(!rendered.includes('data-p053-instance="sprite-187/depth-1/generation-2"'),
  'source mask is not a painted teaching shape');
 const ids=[...rendered.matchAll(/\sid="([^"]+)"/gu)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const m of rendered.matchAll(/(?:href="#|url\(#)([^"\)]+)["\)]/gu))
  assert(ids.includes(m[1]),`resolved local vector or clip reference ${m[1]}`);
});

test('frame693 hides popup and message only through explicit source-backed flags',()=>{
 const hidden=renderToStaticMarkup(<P053SourceScene frame={693}/>);
 assert.doesNotMatch(hidden,/data-p053-character="104"/u);
 const shown=renderToStaticMarkup(<P053SourceScene frame={693} popupVisible levelMessageVisible/>);
 assert.match(shown,/data-p053-character="104"/u);
 assert.match(shown,/data-p053-button-static-state="up"/u);
 assert.match(shown,/data-p053-text-id="103"/u);
 assert(P053_DISPLAY_DATA.boundary.popupCloseReceiverUnresolved);
 assert(P053_DISPLAY_DATA.boundary.laterStartHostExecutionUnresolved);
});

test('two scenes namespace all local definitions independently',()=>{
 const rendered=renderToStaticMarkup(<><P053SourceScene frame={221}/><P053SourceScene frame={693}/></>);
 const ids=[...rendered.matchAll(/\sid="([^"]+)"/gu)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
});
