import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {P052_TEXT_BINDING,p052TextSnapshot} from '../src/nms-l02-p052-text-snapshot-v1';
import {validateLessonTextBinding} from '../src/lesson-text-snapshot';
import type {P052CaptureIdentityRequest} from '../src/nms-l02-p052-capture-identity-v1';
import {p052IntroText} from '../src/nms-l02-p052-intro-view-v1';
const audit=new URL('../../../migrations/shared-nms002-l02-p052/audit/',import.meta.url);
const plan=JSON.parse(fs.readFileSync(new URL('native-main-capture-plan-v1.json',audit),'utf8'));
const catalog=JSON.parse(fs.readFileSync(new URL('source-text-catalog-v1.json',audit),'utf8'));
function request(row:any,frame=row.range.first):P052CaptureIdentityRequest{return {frame,frameDomain:'sprite-350',rootFrame:6,scenario:row.scenario,language:row.language,seed:row.seed,traceId:row.id,requirementId:`req-${row.id}`,entryStateSha256:row.entryStateSha256};}
test('text binding references existing exact-source characters and no invented suppression instances',()=>{
 validateLessonTextBinding(P052_TEXT_BINDING);assert.equal(P052_TEXT_BINDING.sourceSwfSha256,catalog.sourceSha256);
 const ids=new Set(catalog.textDefinitions.map((t:any)=>`character-${t.characterId}`));
 for(const block of P052_TEXT_BINDING.blocks){for(const id of block.sourceTextIds)assert.ok(ids.has(id),id);assert.equal(block.instance,undefined);}
});
test('all1704 planned frames produce ready bilingual snapshots with exact identities',()=>{
 let count=0;for(const row of plan.requirements)for(let frame=row.range.first;frame<=row.range.last;frame++){
  const snapshot=p052TextSnapshot(request(row,frame));assert.equal(snapshot.status,'ready');assert.deepEqual(snapshot.blockers,[]);
  assert.equal(snapshot.identity.frame,frame);assert.equal(snapshot.identity.language,row.language);
  assert.equal(snapshot.blocks.length,P052_TEXT_BINDING.blocks.length);assert.deepEqual(snapshot.suppressedInstances,[]);count++;
 }assert.equal(count,1704);
});
test('feedback, nested glossary and outro retain their distinct visible teaching text',()=>{
 const snapshot=(scenario:string)=>p052TextSnapshot(request(plan.requirements.find((r:any)=>r.scenario===scenario&&r.language==='es'&&r.seed===0)));
 const block=(scenario:string,id:string)=>snapshot(scenario).blocks.find(b=>b.id===id)!;
 assert.equal(block('first-wrong','feedback').text,'Inténtalo de nuevo.');
 assert.match(block('second-wrong-reveal','feedback').text,/75.*100/);
 assert.equal(block('glossary-column','glossary-title').text,'Columna');
 assert.equal(block('glossary-column','example').text,'Ejemplo: 35%');
 assert.equal(block('outro-correct','done').visible,false);assert.equal(block('outro-correct','digits').text,'075%');
 assert.equal(block('paused-help','resume').visible,true);
});
test('intro text visibility follows the same source alpha projection as the actual view',()=>{
 for(const language of ['en','es'] as const){
  const row=plan.requirements.find((r:any)=>r.scenario==='intro'&&r.language===language&&r.seed===0);
  for(let frame=1;frame<=114;frame++){
   const blocks=p052TextSnapshot(request(row,frame)).blocks,view=p052IntroText(frame,language);
   const visible=(id:string)=>blocks.find(b=>b.id===id)!.visible;
   assert.equal(visible('question'),view.questionAlpha>0);assert.equal(visible('prompt'),view.promptAlpha>0);
   assert.equal(visible('digits'),view.labels.some(l=>l.kind==='digit'&&l.alpha>0));
   assert.equal(visible('done'),view.labels.some(l=>l.sourceId===168&&l.alpha>0));
   assert.equal(visible('reset'),view.labels.some(l=>l.sourceId===170&&l.alpha>0));
  }
 }
});
