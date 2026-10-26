import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P046Partition,p046PartitionWindow} from '../src/nms-l02-p046-partition-v1';
test('every boundary part is addressable without allocating the whole count',()=>{
 for(const parts of [1,2,20,21,1000,Number.MAX_SAFE_INTEGER])for(const target of [1,parts]){
  const w=p046PartitionWindow(parts,target);assert(w.indices.includes(target));assert(w.indices.length<=20);assert(w.indices.every(n=>Number.isSafeInteger(n)&&n>=1&&n<=parts));assert.equal(w.end,w.indices.at(-1));
 }
 for(const args of [[0,1],[20,21],[20,0],[NaN,1]])assert.throws(()=>p046PartitionWindow(...args as [number,number]));
});
test('large counts retain bounded controls and explicit whole/detail distinction',()=>{
 for(const language of ['en','es']as const){
  const html=renderToStaticMarkup(<P046Partition parts={Number.MAX_SAFE_INTEGER} selected={[1,Number.MAX_SAFE_INTEGER]} language={language} onToggle={()=>{}}/>);
  assert(html.length<20000);assert.equal((html.match(/aria-pressed=/g)??[]).length,20);assert.equal((html.match(/fill="#0000ff"/g)??[]).length,2);assert(html.includes(String(Number.MAX_SAFE_INTEGER)));
  assert(html.includes(language==='es'?'Detalle:':'Detail:'));
 }
});
test('source blue selection is a pressed control and locked mode disables exploration',()=>{
 const html=renderToStaticMarkup(<P046Partition parts={4} selected={[2]} interactive={false} onToggle={()=>{}}/>);
 assert.equal((html.match(/aria-pressed="true"/g)??[]).length,1);assert.equal((html.match(/<button[^>]*disabled=""/g)??[]).length,4);assert.match(html,/aria-label="Part 2 of 4"/);
 assert.throws(()=>renderToStaticMarkup(<P046Partition parts={4} selected={[5]} onToggle={()=>{}}/>));
});
