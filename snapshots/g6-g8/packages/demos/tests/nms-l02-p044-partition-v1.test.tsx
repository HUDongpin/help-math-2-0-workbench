import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {P044Partition} from '../src/nms-l02-p044-partition-v1';
test('every source partition has exact part identities and selected numerator in both languages',()=>{
  const audit=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p044/audit/partition-state-audit-v1.json',import.meta.url),'utf8'));
  for(const language of ['en','es']as const)for(let parts=1;parts<=20;parts++)for(let selectedCount=0;selectedCount<=parts;selectedCount++){
    const selected=Array.from({length:selectedCount},(_,i)=>i+1);
    const html=renderToStaticMarkup(<P044Partition parts={parts} selected={selected} language={language} onToggle={()=>{}}/>);
    assert.equal((html.match(/<button /g)??[]).length,parts);assert.equal((html.match(/aria-pressed="true"/g)??[]).length,selectedCount);
    for(const piece of audit.states[parts-1].pieces)assert.ok(html.includes(`data-source-instance="${piece.name}"`));
    assert.ok(html.includes(`${selectedCount}/${parts}`));assert.ok(html.includes(language==='es'?(parts===1?'parte igual':'partes iguales'):(parts===1?'equal part':'equal parts')));
  }
});
test('feedback view disables every control; invalid counts or duplicate selections are rejected',()=>{
  const html=renderToStaticMarkup(<P044Partition parts={6} selected={[1,2,3,4]} disabled onToggle={()=>{}}/>);
  assert.equal((html.match(/disabled=""/g)??[]).length,6);
  for(const [parts,selected]of [[0,[]],[21,[]],[2,[3]],[2,[1,1]]]as const)assert.throws(()=>renderToStaticMarkup(<P044Partition parts={parts} selected={selected} onToggle={()=>{}}/>),/IDENTITY/);
});
