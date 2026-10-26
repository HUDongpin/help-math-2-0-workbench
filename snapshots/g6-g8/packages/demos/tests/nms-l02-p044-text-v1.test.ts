import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P044_TEXT_BINDING,p044TextSnapshot} from '../src/nms-l02-p044-text-v1';
import {p044ModuleFrame} from '../src/nms-l02-p044-frame-v1';
test('all text references belong to exact source including six dynamic fields',()=>{
  const source=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p044/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
  assert.equal(source.sourceSha256,P044_TEXT_BINDING.sourceSwfSha256);const ids=new Set(source.textDefinitions.map((t:{sourceTextId:string})=>t.sourceTextId));
  const bound=new Set(P044_TEXT_BINDING.blocks.flatMap(b=>b.sourceTextIds));for(const id of bound)assert.ok(ids.has(id));
  for(const id of [220,221,222,223,233,237])assert.ok(bound.has(`character-${id}`));
});
test('all root/main frames produce complete bilingual snapshots with authored example changes',()=>{
  for(const lang of ['en','es']as const)for(const [frameDomain,count]of [['root',10],['sprite-243',393]]as const)for(let frame=1;frame<=count;frame++){
    const snap=p044TextSnapshot(p044ModuleFrame(frame,{frame,frameDomain,lang,seed:0,scenario:'source-inspection'}));assert.equal(snap.status,'ready');assert.deepEqual(snap.blockers,[]);
    assert.equal(snap.blocks.find(b=>b.id==='course-title')!.visible,!(frameDomain==='root'&&frame<6));
    if(frameDomain==='sprite-243'&&frame===132)assert.equal(snap.blocks.find(b=>b.id==='selection-fraction')!.text,'1/4');
    if(frameDomain==='sprite-243'&&frame===323)assert.equal(snap.blocks.find(b=>b.id==='target')!.text,'1/5');
  }
});
test('help and feedback snapshots expose only the current state; glossary requires explicit open state',()=>{
  const query=(frameDomain:string,scenario:string)=>p044ModuleFrame(1,{frame:1,frameDomain,scenario,lang:'en',seed:0});
  const help=p044TextSnapshot(query('sprite-29','help-example'));assert.equal(help.blocks.find(b=>b.id==='help-fraction')!.visible,true);
  const wrong=p044TextSnapshot(query('sprite-234','first-wrong'));assert.equal(wrong.blocks.find(b=>b.id==='wrong')!.visible,true);assert.equal(wrong.blocks.find(b=>b.id==='correct')!.visible,false);
  const ready=p044ModuleFrame(361,{frame:361,scenario:'source-inspection',lang:'es',seed:0});assert.equal(p044TextSnapshot(ready,'numerator').blocks.find(b=>b.id==='glossary-numerator')!.text,'Numerador');
  assert.throws(()=>p044TextSnapshot(query('sprite-234','first-wrong'),'fraction'),/GLOSSARY/);
});
