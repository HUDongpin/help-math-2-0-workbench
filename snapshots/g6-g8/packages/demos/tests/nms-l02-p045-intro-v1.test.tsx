import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {p045IntroFrame} from '../src/nms-l02-p045-intro-v1';
import {P045IntroFigure} from '../src/nms-l02-p045-intro-figure-v1';
import {P045_INTRO_ASSETS} from '../src/generated/nms-l02-p045-intro-assets-v1';
test('source example types six and ten in order, then clears before live practice',()=>{
 assert.equal(p045IntroFrame(172).numerator,'');assert.equal(p045IntroFrame(173).numerator,'6');
 assert.equal(p045IntroFrame(234).denominator,'');assert.equal(p045IntroFrame(235).denominator,'1');assert.equal(p045IntroFrame(237).denominator,'10');
 assert.equal(p045IntroFrame(285).numerator,'6');assert.equal(p045IntroFrame(286).numerator,'');assert.equal(p045IntroFrame(286).denominator,'');assert.equal(p045IntroFrame(286).shapeId,117);assert.equal(p045IntroFrame(449).shapeId,117);
 assert.equal(p045IntroFrame(41).unitLabel,'1/10');assert.throws(()=>p045IntroFrame(450),/P045_INTRO_FRAME/);
});
test('all intro frames have a bounded source asset or the initial empty state',()=>{
 for(let frame=1;frame<=449;frame++){const s=p045IntroFrame(frame);assert(s.alpha>=0&&s.alpha<=1);if(s.shapeId!==null)assert(Object.hasOwn(P045_INTRO_ASSETS,String(s.shapeId)));}
 for(const frame of [0,-1,1.5,NaN,Infinity])assert.throws(()=>p045IntroFrame(frame));
 assert.equal(renderToStaticMarkup(<P045IntroFigure frame={1}/>),'');
});
test('gradient identifiers are instance-local and bilingual descriptions remain available',()=>{
 for(const language of ['en','es']as const){const html=renderToStaticMarkup(<><P045IntroFigure frame={237} language={language}/><P045IntroFigure frame={237} language={language}/></>);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert(ids.length>0);assert.equal(ids.length,new Set(ids).size);
  for(const match of html.matchAll(/url\(#([^)]*)\)/g))assert(ids.includes(match[1]));
  assert(!html.includes('__P045_PREFIX__'));assert(html.includes('radialGradient'));assert(html.includes(language==='es'?'demostración':'Demonstration'));assert(!html.includes('<script'));
 }
});
test('reduced motion removes decorative fade while retaining the same source chart',()=>{
 const state=p045IntroFrame(6);assert(state.alpha>0&&state.alpha<1);
 const normal=renderToStaticMarkup(<P045IntroFigure frame={6}/>),reduced=renderToStaticMarkup(<P045IntroFigure frame={6} reducedMotion/>);
 assert(normal.includes(`opacity:${state.alpha}`));assert(reduced.includes('opacity:1'));
 assert.deepEqual([...normal.matchAll(/ d="([^"]+)"/g)].map(m=>m[1]),[...reduced.matchAll(/ d="([^"]+)"/g)].map(m=>m[1]));
});
