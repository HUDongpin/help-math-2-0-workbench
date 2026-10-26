import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {P052IntroGraphics,p052StageMatrix} from '../src/nms-l02-p052-intro-graphics-v1';
import {p052IntroScene} from '../src/nms-l02-p052-intro-scene-v1';
import {P052_INTRO_SCENE} from '../src/generated/nms-l02-p052-intro-scene-v1';
test('every authored intro frame renders exactly its ordered source graphics',()=>{
 for(let frame=1;frame<=114;frame++){
  const html=renderToStaticMarkup(<P052IntroGraphics frame={frame}/>);
  const expected=p052IntroScene(frame).filter(o=>o.kind==='shape');
  assert.deepEqual([...html.matchAll(/data-p052-source-shape="(\d+)"/g)].map(m=>Number(m[1])),expected.map(o=>o.characterId));
  assert.equal((html.match(/<image /g)||[]).length,expected.length);
  assert.match(html,/viewBox="0 0 800 600"/);assert.doesNotMatch(html,/<text/);
 }
});
test('translations convert twips once while linear scale/rotation remain unchanged',()=>{
 assert.equal(p052StageMatrix([1,0,0,1,8248,5666]),'matrix(1 0 0 1 412.4 283.3)');
 assert.equal(p052StageMatrix([0,2,-3,0,-400,100]),'matrix(0 2 -3 0 -20 5)');
 for(const bad of [[],[1,0,0,1,NaN,0],[1,0,0,1,0,Infinity]])assert.throws(()=>p052StageMatrix(bad));
});
test('each vector preserves full SVG document and normalization origin without shared gradient IDs',()=>{
 const seen=new Set<number>();for(let frame=1;frame<=114;frame++){
  const html=renderToStaticMarkup(<P052IntroGraphics frame={frame}/>);
  for(const o of p052IntroScene(frame).filter(o=>o.kind==='shape')){
   const v=P052_INTRO_SCENE.vectors.find(v=>v.characterId===o.characterId)!;seen.add(o.characterId);
   // React escapes apostrophes in attributes, so decode the extracted href via entity reversal.
   const encoded=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(v.svg)}`.replace(/'/g,'&#x27;');
   assert.ok(html.includes(encoded));assert.ok(html.includes(`x="${v.originX}" y="${v.originY}"`));
  }
 }
 assert.equal(seen.size,37);
});
test('graphics rejects practice/outro instead of showing a stale intro',()=>{
 for(const frame of [0,115,156,1.5])assert.throws(()=>renderToStaticMarkup(<P052IntroGraphics frame={frame}/>));
});
