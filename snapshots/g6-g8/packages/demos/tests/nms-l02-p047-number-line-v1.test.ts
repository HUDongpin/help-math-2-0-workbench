import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P047NumberLine,p047PointerTick} from '../src/nms-l02-p047-number-line-v1';
import {p047Initial,p047FinishPhase,p047Select,p047Drop} from '../src/nms-l02-p047-practice-v1';
test('responsive hit mapping retains nine equally spaced marks and rejects outside releases',()=>{
 for(const width of [240,320,768,1280]){const b={left:17,top:23,width,height:160};for(let tick=0;tick<=8;tick++)assert.equal(p047PointerTick(b.left+width*(tick+.5)/9,80,b),tick);assert.equal(p047PointerTick(16,80,b),null);assert.equal(p047PointerTick(18,22,b),null);assert.equal(p047PointerTick(18,184,b),null);}
 assert.equal(p047PointerTick(NaN,0,{left:0,top:0,width:100,height:100}),null);
});
test('native markup exposes cards, alternate target buttons and preserved worked example',()=>{
 const initial=p047Initial();let state=p047FinishPhase(initial,initial.phaseToken);
 const render=()=>renderToStaticMarkup(React.createElement(P047NumberLine,{state,onSelect(){},onDrop(){},onCancel(){}}));
 let html=render();assert.equal((html.match(/data-p047-tick=/g)||[]).length,9);assert.equal((html.match(/data-p047-card=/g)||[]).length,4);assert.equal((html.match(/data-p047-target=/g)||[]).length,7);assert(html.includes('aria-label="3/4"'));assert(html.includes('role="status"'));
 state=p047Drop(p047Select(state,1),4);html=render();assert(html.includes('hidden=""'));assert(html.includes('aria-label="1/2"'));assert(html.includes('1 of 4 placed'));
});
