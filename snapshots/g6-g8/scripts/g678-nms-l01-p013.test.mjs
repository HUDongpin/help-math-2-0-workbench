import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P011Descriptor} from '../apps/web/lib/g678-nms-l01-p011.server.ts';
import {readNmsL1P013Packet,extendNmsL1P013Descriptor,nmsL1P013Descriptor,nmsL1P013Canvas,NMS_L1_P013_ID} from '../apps/web/lib/g678-nms-l01-p013.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P011Descriptor(),packet=readNmsL1P013Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P013_ID);
test('the exact thirteenth source placement extends the21-page predecessor to22 and preserves all other pages',()=>{
  const d=nmsL1P013Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,22);
  for(let i=0;i<47;i++)if(i!==12)assert.deepEqual(d.pages[i],base.pages[i]);
  assert.equal(d.pages[12].animationId,NMS_L1_P013_ID);assert.equal(d.pages[12].rendererAvailability.kind,'registered');assert.equal(d.pages[12].rendererAvailability.runtimeQuery.frameDomain,'sprite-112');
  const added=[];assert.equal(d.glossary.length,31);assert.deepEqual(d.glossary.filter(e=>!added.includes(e.id)),base.glossary);
  for(const id of added){const e=d.glossary.find(e=>e.id===id);assert(e.definitions.en);assert(e.definitions.es);assert.equal(e.source.en.sha256,'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b');}
  assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('a wrong predecessor, glossary or registration cannot partially extend the lesson',()=>{
  const copy=structuredClone(base);
  for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P013Descriptor(base,packet,reg));
  for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=14;},b=>{b.pages[12].globalPageOrdinal=7;},b=>{b.glossary.find(e=>e.id==='integers').definitions.en+=' changed';}]){
    const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P013Descriptor(b,packet,registration));
  }
  assert.deepEqual(base,copy);
});
test('the Canvas endpoint reader returns only the source-bound registered artifact',()=>{
  const result=nmsL1P013Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);
  assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared placements and46 of47 NMSL1 pages while publication stays closed',()=>{
  const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);
  const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});

test('source suffix mapping and feedback use the complete page behavior',()=>{
 assert.deepEqual(packet.practice.choices.map(c=>[c.sourceIndex,c.value,c.sourceCharacterId,c.target.sourceCharacterId]),[[1,-7,70,58],[2,-3,71,60],[3,0,72,64],[4,-1,73,62],[5,1,74,65],[6,3,75,66],[7,7,76,67],[8,9,77,68]]);
 assert.equal(packet.audioPlan.mainFrameCount,243);assert.equal(packet.audioPlan.questionFrame,196);assert.equal(packet.audioPlan.outroFirstFrame,197);
 assert.deepEqual(packet.audioPlan.clips.map(c=>c.frameDomain),['sprite-112','sprite-103','sprite-111']);
 assert(packet.audioPlan.clips.every(c=>c.normalization==='unchanged-embedded-MP3'));
});
