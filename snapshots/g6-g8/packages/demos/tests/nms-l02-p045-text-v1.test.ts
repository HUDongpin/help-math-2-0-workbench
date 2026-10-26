import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P045_TEXT_BINDING,p045TextSnapshot} from '../src/nms-l02-p045-text-v1';
import {p045ModuleFrame} from '../src/nms-l02-p045-frame-v1';
import {p045IntroFrame} from '../src/nms-l02-p045-intro-v1';
test('text role references belong to the exact source including input and feedback fields',()=>{
  const source=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p045/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
  assert.equal(source.sourceSha256,P045_TEXT_BINDING.sourceSwfSha256);const ids=new Set(source.textDefinitions.map((t:{sourceTextId:string})=>t.sourceTextId));
  const bound=new Set(P045_TEXT_BINDING.blocks.flatMap(b=>b.sourceTextIds));for(const id of bound)assert.ok(ids.has(id));
  for(const id of [129,130,187,192])assert.ok(bound.has(`character-${id}`));
});
test('all root and main frames have complete bilingual snapshots without answer leakage',()=>{
  for(const lang of ['en','es']as const)for(const [frameDomain,count]of [['root',10],['sprite-204',498]]as const)for(let frame=1;frame<=count;frame++){
    const s=p045ModuleFrame(frame,{frame,frameDomain,lang,seed:0,scenario:'source-inspection'}),snap=p045TextSnapshot(s);
    assert.equal(snap.status,'ready');assert.deepEqual(snap.blockers,[]);
    const get=(id:string)=>snap.blocks.find(b=>b.id===id)!;
    assert.equal(get('course-title').visible,!(frameDomain==='root'&&frame<6));
    if(frameDomain==='sprite-204'&&frame<450){const demo=p045IntroFrame(frame);assert.equal(get('numerator').text,demo.numerator);assert.equal(get('denominator').text,demo.denominator);assert.equal(get('activity-title').visible,frame>=5);}
    if(frameDomain==='sprite-204'&&frame>=450){assert.equal(get('numerator').text,'');assert.equal(get('denominator').text,'');assert.equal(get('complete').visible,false);}
  }
});
test('help, feedback, reveal and glossary visibility follow explicit state',()=>{
  const query=(frame:number,scenario:string,frameDomain='sprite-204')=>p045ModuleFrame(frame,{frame,frameDomain,scenario,lang:'es',seed:0});
  const get=(s:ReturnType<typeof p045TextSnapshot>,id:string)=>s.blocks.find(b=>b.id===id)!;
  assert.equal(get(p045TextSnapshot(query(1,'help-example','sprite-30')),'help-fraction').visible,true);
  const wrong=p045TextSnapshot(query(450,'first-wrong'));assert.equal(get(wrong,'wrong').visible,true);assert.equal(get(wrong,'correct').visible,false);
  const reveal=p045TextSnapshot(query(2,'second-wrong-reveal','sprite-189'));assert.equal(get(reveal,'numerator').text,'2');assert.equal(get(reveal,'denominator').text,'10');assert.equal(get(reveal,'reveal').visible,true);
  assert.equal(get(p045TextSnapshot(query(498,'three-questions-complete')),'complete').visible,true);
  assert.equal(get(p045TextSnapshot(query(450,'source-inspection'),'numerator'),'glossary-numerator').text,'Numerador');
  assert.throws(()=>p045TextSnapshot(query(450,'first-wrong'),'fraction'),/GLOSSARY/);
});
