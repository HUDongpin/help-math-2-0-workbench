import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P045IntroView} from '../src/nms-l02-p045-intro-view-v1';
test('bilingual demonstration shows source typing beats in separately labelled read-only fields',()=>{
 for(const language of ['en','es']as const)for(const [frame,n,d]of [[172,'',''],[173,'6',''],[235,'6','1'],[237,'6','10'],[286,'',''],[449,'','']]as const){
  const html=renderToStaticMarkup(<P045IntroView frame={frame} language={language}/>);
  const inputs=[...html.matchAll(/<input\b[^>]*>/g)].map(m=>m[0]);assert.equal(inputs.length,2);
  assert(inputs[0].includes(`value="${n}"`));assert(inputs[1].includes(`value="${d}"`));
  for(const input of inputs){assert(input.includes('readOnly=""'));const id=input.match(/id="([^"]+)"/)![1];assert(html.includes(`for="${id}"`));}
  assert(html.includes(language==='es'?'Numerador':'Numerator'));assert(html.includes(language==='es'?'Denominador':'Denominator'));
  assert.equal((html.match(/<button[^>]*disabled=""/g)??[]).length,2);assert(!html.includes('shope'));
 }
 assert.equal(renderToStaticMarkup(<P045IntroView frame={1}/>),'');
});
test('inspection disables all glossary actions while preserving instructional content',()=>{
 const live=renderToStaticMarkup(<P045IntroView frame={173}/>);
 const inspection=renderToStaticMarkup(<P045IntroView frame={173} interactive={false}/>);
 assert.equal((live.match(/<button[^>]*disabled=""/g)??[]).length,2);
 assert.equal((inspection.match(/<button[^>]*disabled=""/g)??[]).length,8);
 assert(inspection.includes('Name the fraction'));assert(inspection.includes('value="6"'));
});
