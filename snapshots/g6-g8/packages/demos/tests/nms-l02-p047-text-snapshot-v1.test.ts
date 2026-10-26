import test from 'node:test';
import assert from 'node:assert/strict';
import {p047ModuleFrame} from '../src/nms-l02-p047-frame-v1';
import {p047TextSnapshot} from '../src/nms-l02-p047-text-v1';
import type {RuntimeContext} from '../src/contract';
const state=(frame:number,lang:'en'|'es'='en',scenario='source-inspection',frameDomain='sprite-81')=>p047ModuleFrame(frame,{frame,lang,scenario,frameDomain,seed:0}as RuntimeContext);
test('all source main frames in both languages produce complete68-block snapshots',()=>{
 for(const lang of ['en','es']as const)for(let frame=1;frame<=188;frame++){const s=p047TextSnapshot(state(frame,lang));assert.equal(s.status,'ready');assert.deepEqual(s.blockers,[]);assert.equal(s.blocks.length,68);assert(s.blocks.every(b=>!b.visible||b.text.trim()));}
});
test('intro duplicate/replacement and practice handoff retain independent visible roles',()=>{
 const visible=(frame:number)=>p047TextSnapshot(state(frame)).blocks.filter(b=>b.visible);
 assert.equal(visible(56).filter(b=>b.id.startsWith('intro-fraction-')&&b.text==='1/8').length,2);assert.equal(visible(57).filter(b=>b.id.startsWith('intro-fraction-')&&b.text==='5/8').length,1);assert.equal(visible(140).filter(b=>b.id.startsWith('intro-fraction-')).length,0);assert.equal(visible(140).filter(b=>/^card-[1-4]$/.test(b.id)).length,4);
});
test('nested glossary retains three help fractions and exposes corrected whole definition',()=>{
 const s=p047TextSnapshot(state(1,'es','help-example','sprite-35'),{glossary:'whole'});assert.equal(s.status,'ready');assert.equal(s.blocks.filter(b=>b.visible&&b.id.startsWith('help-fraction-')).length,3);assert(s.blocks.find(b=>b.id==='glossary-whole-definition')?.text.includes('unidad'));assert.throws(()=>p047TextSnapshot(state(1),{glossary:'whole'}),/GLOSSARY_STATE/);
});
