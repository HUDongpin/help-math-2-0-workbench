import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P047IntroView,p047IntroLift} from '../src/nms-l02-p047-intro-view-v1';
const render=(frame:number,reducedMotion=false)=>renderToStaticMarkup(React.createElement(P047IntroView,{frame,reducedMotion}));
test('source intro duplicate, replacement and worked example render in frame order',()=>{
 const early=render(56),later=render(57);assert.equal((early.match(/data-source-text="43"/g)||[]).length,2);assert.equal((later.match(/data-source-text="43"/g)||[]).length,1);assert(later.includes('data-source-text="55"'));assert(render(139).includes('aria-label="3/4"'));
});
test('term cues retain blink intervals and reduced-motion removes moving pointer',()=>{
 assert(render(59).includes('p047-term-cue" aria-hidden="true">fraction'));assert(!render(60).includes('p047-term-cue" aria-hidden="true">fraction'));assert(render(64).includes('p047-intro-pointer'));assert(!render(64,true).includes('p047-intro-pointer'));assert(!render(118).includes('p047-intro-pointer'));
});

test('clearance adapter preserves source transition endpoints and is bounded between them',()=>{
 assert.equal(p047IntroLift(57),0);assert.equal(p047IntroLift(64),0);for(let frame=58;frame<64;frame++)assert(p047IntroLift(frame)>0&&p047IntroLift(frame)<=4);
});
