import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from './contract';
import {p004TextSnapshot} from './alg-l06-p004-text-snapshot-v1';
import {P004NativeTextV1} from './alg-l06-p004-native-text-v1';
import {P004_SEMANTIC_TEXT_BINDING,p004SemanticText} from './alg-l06-p004-semantic-text-v1';
const context=(frame:number,lang:'en'|'es'='en',replay=0):RuntimeContext=>({frame,frameDomain:'sprite-95',rootFrame:6,scenario:'source-static-frame',lang,seed:0,replay});
test('shared builder receives complete values including hidden blocks for all831 frames, without Canvas suppression',()=>{
 for(let frame=1;frame<=831;frame++){
  const snapshot=p004TextSnapshot(context(frame));assert.equal(snapshot.status,'ready');
  assert.equal(snapshot.blocks.length,P004_SEMANTIC_TEXT_BINDING.blocks.length);
  assert.deepEqual(snapshot.suppressedInstances,[]);
  const active=p004SemanticText(frame);
  assert.deepEqual(snapshot.blocks.filter(b=>b.visible).map(b=>b.id).sort(),active.map(r=>r.id).sort());
  assert(snapshot.blocks.every(b=>typeof b.text==='string'&&b.text.length>0));
 }
 for(const [before,after,id] of [[92,93,'equation93'],[610,611,'character-78/run-0'],[683,684,'character-83/run-0']] as const){
  const matches=(frame:number)=>p004TextSnapshot(context(frame)).blocks.filter(b=>b.visible&&
   (b.id===id||P004_SEMANTIC_TEXT_BINDING.blocks.find(x=>x.id===b.id)?.sourceTextIds.includes(id)));
  assert.equal(matches(before).length,0);assert.equal(matches(after).length,1);
 }
 const first=p004TextSnapshot(context(1));p004TextSnapshot(context(831));const replay=p004TextSnapshot(context(1,'en',2));
 assert.deepEqual(first.blocks,replay.blocks);assert.equal(replay.identity.replay,2);
 assert.equal(first.blocks.filter(b=>b.visible&&b.text==='0').length,0);
});
test('invalid runtime identity fails closed and ES retains actual EN content language',()=>{
 for(const delta of [{frame:0},{frame:832},{frame:1.5},{frameDomain:'root'},{rootFrame:1},{scenario:'other'},{seed:1},{replay:-1},{replay:0.5},{lang:'fr'}])
  assert.throws(()=>p004TextSnapshot({...context(1),...delta} as RuntimeContext),RangeError);
 const es=p004TextSnapshot(context(93,'es'));assert.equal(es.identity.language,'es');assert(es.blocks.every(b=>b.language==='en'));
});
test('actual native component renders shared blocks, exact source metadata, math and fallback',()=>{
 const markup=renderToStaticMarkup(React.createElement(P004NativeTextV1,{snapshot:p004TextSnapshot(context(93,'es'))}));
 assert(markup.includes('role="math"'));assert(markup.includes('aria-label="M equals 0.50 dollars multiplied by C"'));
 assert(markup.includes('data-p004-source-fallback="true"'));assert(markup.includes('lesson-text-presentation__block--title'));
 assert(markup.includes('character-52/run-0'));assert(markup.includes('character-39/run-0'));
 assert(markup.includes('sprite-95/depth-80/generation-5'));assert(markup.includes('data-p004-canvas-suppression="none"'));
});

test('rendered math labels follow worked expressions and exact outline provenance',()=>{
 const render=(frame:number)=>renderToStaticMarkup(React.createElement(P004NativeTextV1,{snapshot:p004TextSnapshot(context(frame))}));
 assert.match(render(84),/data-source-shape-ids="49"/);
 assert.match(render(92),/data-source-shape-ids="50"/);
 for(const frame of [1,84,92,93])assert.equal((render(frame).match(/role="math"/g)||[]).length,1);
 assert.match(render(315),/aria-label="M equals 0.50 dollars multiplied by 5"/);
 assert.doesNotMatch(render(366),/which equals 2.50 dollars/);
 assert.match(render(367),/aria-label="M equals 0.50 dollars multiplied by 5, which equals 2.50 dollars"/);
 assert.match(render(374),/aria-label="0.50 dollars multiplied by 5 equals 2.50 dollars"/);
 assert.doesNotMatch(render(462),/data-p004-text-block="equation-worked/);
});
