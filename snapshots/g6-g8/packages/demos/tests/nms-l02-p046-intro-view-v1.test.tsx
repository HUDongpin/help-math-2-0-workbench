import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P046IntroView} from '../src/nms-l02-p046-intro-view-v1';
test('both languages preserve exact source counts and fourth green selection',()=>{
 for(const language of ['en','es']as const)for(const [frame,count,selected]of [[196,2,0],[204,6,0],[235,5,0],[298,5,1],[653,5,1]]){
  const html=renderToStaticMarkup(<P046IntroView frame={frame} language={language}/>);assert.equal((html.match(/<rect /g)??[]).length,count);assert.equal((html.match(/fill="#99cc33"/g)??[]).length,selected);
  if(selected)assert.match(html,/<rect[^>]*data-part="4"[^>]*data-selected="true"/);
  assert(html.includes('2/10'));assert.equal((html.match(/<button[^>]*disabled=""/g)??[]).length,4);
 }
});
test('typed answer appears at authored frames in labelled read-only fields',()=>{
 for(const [frame,n,d]of [[470,'',''],[471,'1',''],[511,'1',''],[512,'1','5']]as const){
  const html=renderToStaticMarkup(<P046IntroView frame={frame}/>),inputs=[...html.matchAll(/<input\b[^>]*>/g)].map(m=>m[0]);assert.equal(inputs.length,2);
  assert(inputs[0].includes(`value="${n}"`));assert(inputs[1].includes(`value="${d}"`));
  for(const input of inputs){assert(input.includes('readOnly=""'));const id=input.match(/id="([^"]+)"/)![1];assert(html.includes(`for="${id}"`));}
 }
 assert.equal(renderToStaticMarkup(<P046IntroView frame={1}/>),'');
});

test('reduced motion holds source emphasis interval without repeated flashes',()=>{
 for(const language of ['en','es']as const)for(let frame=577;frame<=594;frame++){
  const render=(reducedMotion:boolean)=>renderToStaticMarkup(<P046IntroView frame={frame} language={language} reducedMotion={reducedMotion}/>).includes('class="p046-equivalence"');
  assert.equal(render(true),frame>=578&&frame<=592);
  assert.equal(render(false),frame>=578&&frame<=592&&frame%2===0);
 }
});
