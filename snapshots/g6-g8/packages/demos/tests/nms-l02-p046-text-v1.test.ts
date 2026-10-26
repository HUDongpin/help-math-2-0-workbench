import {p046SetParts} from '../src/nms-l02-p046-practice-v1';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P046_TEXT_BINDING,p046TextSnapshot} from '../src/nms-l02-p046-text-v1';
import {p046ModuleFrame} from '../src/nms-l02-p046-frame-v1';
import {p046IntroFrame} from '../src/nms-l02-p046-intro-v1';
test('text role references belong to the exact source including input and feedback fields',()=>{
  const source=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p046/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
  assert.equal(source.sourceSha256,P046_TEXT_BINDING.sourceSwfSha256);const ids=new Set(source.textDefinitions.map((t:{sourceTextId:string})=>t.sourceTextId));
  const bound=new Set(P046_TEXT_BINDING.blocks.flatMap(b=>b.sourceTextIds));for(const id of bound)assert.ok(ids.has(id));
  for(const id of [140,141,187,200])assert.ok(bound.has(`character-${id}`));
});
test('bound roles have bilingual snapshots across root and main frames without answer leakage',()=>{
  for(const lang of ['en','es']as const)for(const [frameDomain,count]of [['root',10],['sprite-205',706]]as const)for(let frame=1;frame<=count;frame++){
    const s=p046ModuleFrame(frame,{frame,frameDomain,lang,seed:0,scenario:'source-inspection'}),snap=p046TextSnapshot(s);
    assert.equal(snap.status,'ready');assert.deepEqual(snap.blockers,[]);
    const get=(id:string)=>snap.blocks.find(b=>b.id===id)!;
    assert.equal(get('course-title').visible,!(frameDomain==='root'&&frame<6));
    if(frameDomain==='sprite-205'&&frame<654){const demo=p046IntroFrame(frame);assert.equal(get('numerator').text,demo.numerator);assert.equal(get('denominator').text,demo.denominator);assert.equal(get('activity-title').visible,demo.visible);}
    if(frameDomain==='sprite-205'&&frame>=654){assert.equal(get('numerator').text,'');assert.equal(get('denominator').text,'');assert.equal(get('complete').visible,false);}
  }
});
test('help, feedback and reveal visibility follow explicit inspection state',()=>{
  const query=(frame:number,scenario:string,frameDomain='sprite-205')=>p046ModuleFrame(frame,{frame,frameDomain,scenario,lang:'es',seed:0});
  const get=(s:ReturnType<typeof p046TextSnapshot>,id:string)=>s.blocks.find(b=>b.id===id)!;
  assert.equal(get(p046TextSnapshot(query(1,'help-example','sprite-30')),'help-fraction').visible,true);
  const wrong=p046TextSnapshot(query(654,'first-wrong'));assert.equal(get(wrong,'wrong').visible,true);assert.equal(get(wrong,'correct').visible,false);
  const reveal=p046TextSnapshot(query(2,'second-wrong-reveal','sprite-168'));assert.equal(get(reveal,'numerator').text,'4');assert.equal(get(reveal,'denominator').text,'8');assert.equal(get(reveal,'reveal').visible,true);
  assert.equal(get(p046TextSnapshot(query(706,'three-questions-complete')),'complete').visible,true);
});

test('glossary content is limited to reachable main/help/wrong contexts and reduced motion holds emphasis',()=>{
 for(const lang of ['en','es']as const){
  const query=(frame:number,scenario='source-inspection',frameDomain='sprite-205')=>p046ModuleFrame(frame,{frame,frameDomain,scenario,lang,seed:0});
  const get=(s:ReturnType<typeof p046TextSnapshot>,id:string)=>s.blocks.find(b=>b.id===id)!;
  const main=p046TextSnapshot(query(654),{glossary:'numerator'});assert(get(main,'glossary-definition-numerator').visible);assert(get(main,'close').visible);
  assert.throws(()=>p046TextSnapshot(query(654),{glossary:'quantity'}),/GLOSSARY_STATE/);
  for(const state of [query(1,'help-example','sprite-30'),query(654,'first-wrong')]){const snap=p046TextSnapshot(state,{glossary:'quantity'});assert(get(snap,'glossary-definition-quantity').visible);assert(get(snap,state.state.helpOpen?'help-body':'wrong').visible);assert.throws(()=>p046TextSnapshot(state,{glossary:'numerator'}),/GLOSSARY_STATE/);}
  assert.throws(()=>p046TextSnapshot(query(654,'first-correct'),{glossary:'fraction'}),/GLOSSARY_STATE/);
  assert.throws(()=>p046TextSnapshot(query(1),{glossary:'fraction'}),/GLOSSARY_STATE/);
  for(let frame=577;frame<=594;frame++){assert.equal(get(p046TextSnapshot(query(frame),{reducedMotion:true}),'equivalence').visible,frame>=578&&frame<=592);assert.equal(get(p046TextSnapshot(query(frame)),'equivalence').visible,frame>=578&&frame<=592&&frame%2===0);}
 }
});

test('partition capture bounds its window while retaining last-part and invalid locator text',()=>{
 for(const lang of ['en','es']as const)for(const parts of [1,20,21,25,129,Number.MAX_SAFE_INTEGER]){
  const initial=p046ModuleFrame(654,{frame:654,frameDomain:'sprite-205',scenario:'source-inspection',lang,seed:0});
  const state={...initial,state:p046SetParts(initial.state,parts)};
  const snap=p046TextSnapshot(state,{partitionRequested:parts,partitionJump:'invalid'});
  const get=(id:string)=>snap.blocks.find(b=>b.id===id)!;
  const buttons=snap.blocks.filter(b=>b.id.startsWith('partition-part-')&&b.visible);
  assert(buttons.length<=20);assert.equal(buttons.at(-1)!.text,String(parts));
  assert.equal(get('partition-show').visible,parts>20);assert.equal(get('partition-number-input').text,'invalid');assert.equal(get('partition-overview-note').visible,parts>128);
  assert(JSON.stringify(snap).length<50000);
  const shrink=p046TextSnapshot({...state,state:p046SetParts(state.state,1)},{partitionRequested:parts});assert.equal(shrink.blocks.find(b=>b.id==='partition-part-1')!.text,'1');
  assert.throws(()=>p046TextSnapshot(state,{partitionRequested:0}),/PARTITION_REQUEST/);
 }
});

test('Done inspection never falsely claims all three questions finished',()=>{
 for(const lang of ['en','es']as const){const state=p046ModuleFrame(706,{frame:706,frameDomain:'sprite-205',scenario:'done-early',lang,seed:0});assert.equal(state.state.finishReason,'done');assert.equal(state.state.questionIndex,0);const snap=p046TextSnapshot(state);const complete=snap.blocks.find(b=>b.id==='complete')!;assert.equal(complete.visible,true);assert.equal(complete.text,lang==='en'?'Practice ended.':'Práctica finalizada.');assert(snap.blocks.find(b=>b.id==='done')!.visible);}
});
