import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P005Descriptor} from '../apps/web/lib/g678-nms-l01-p005.server.ts';
import {readNmsL1P007Packet,extendNmsL1P007Descriptor,nmsL1P007Descriptor,nmsL1P007Canvas,NMS_L1_P007_ID} from '../apps/web/lib/g678-nms-l01-p007.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P005Descriptor(),packet=readNmsL1P007Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P007_ID);
test('the exact seventh source placement extends the16-page predecessor to17 and preserves all other pages',()=>{
  const d=nmsL1P007Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,17);
  for(let i=0;i<47;i++)if(i!==6)assert.deepEqual(d.pages[i],base.pages[i]);
  assert.equal(d.pages[6].animationId,NMS_L1_P007_ID);assert.equal(d.pages[6].rendererAvailability.kind,'registered');assert.equal(d.pages[6].rendererAvailability.runtimeQuery.frameDomain,'sprite-120');
  assert.equal(d.glossary.length,25);assert.deepEqual(d.glossary.filter(e=>e.id!=='position'),base.glossary);
  const position=d.glossary.find(e=>e.id==='position');assert(position.definitions.en);assert(position.definitions.es);assert.equal(position.source.en.sha256,'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b');
  assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('a wrong predecessor, glossary or registration cannot partially extend the lesson',()=>{
  const copy=structuredClone(base);
  for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P007Descriptor(base,packet,reg));
  for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=14;},b=>{b.pages[6].globalPageOrdinal=6;},b=>{b.glossary.find(e=>e.id==='integers').definitions.en+=' changed';}]){
    const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P007Descriptor(b,packet,registration));
  }
  assert.deepEqual(base,copy);
});
test('the Canvas endpoint reader returns only the source-bound registered artifact',()=>{
  const result=nmsL1P007Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);
  assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared placements and46 of47 NMSL1 pages while publication stays closed',()=>{
  const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);
  const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
