import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import {p040InstructionAt,P040Instruction} from '../src/nms-l02-p040-instruction-v1';
const audit=JSON.parse(readFileSync(fileURLToPath(new URL('../../../migrations/shared-nms002-l02-p040/audit/source-glyph-mask-v1.json',import.meta.url)),'utf8'));
test('every frame agrees with independent source glyph containment',()=>{
 for(const row of audit.frames){const actual=p040InstructionAt(row.frame).filter(g=>g.text.trim()&&g.visible).map(g=>g.offset);assert.deepEqual(actual,row.fullyContainedOffsets,`frame${row.frame}`);}
 assert.equal(p040InstructionAt(102).map(g=>g.text).join(''),audit.text);
 assert.throws(()=>p040InstructionAt(0),/P040_FRAME/);
});
test('word controls enable only at complete source-word boundaries',()=>{
 for(const [term,frame]of [['percent',60],['equivalent',78],['fraction',83],['denominator',97]]as const){
  const before=renderToStaticMarkup(<P040Instruction frame={frame-1} onTerm={()=>{}}/>),after=renderToStaticMarkup(<P040Instruction frame={frame} onTerm={()=>{}}/>);
  assert.match(before,new RegExp(`data-p040-term="${term}" disabled=""`));assert.doesNotMatch(after,new RegExp(`data-p040-term="${term}" disabled=""`));
 }
 const reduced=renderToStaticMarkup(<P040Instruction frame={1} reducedMotion onTerm={()=>{}}/>);assert.doesNotMatch(reduced,/visibility:hidden/);assert.equal((reduced.match(/disabled=""/g)??[]).length,4);
});
