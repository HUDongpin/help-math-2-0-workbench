import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P007Descriptor} from '../apps/web/lib/g678-nms-l01-p007.server.ts';
import {readNmsL1P008Packet,extendNmsL1P008Descriptor,nmsL1P008Descriptor,nmsL1P008Canvas,NMS_L1_P008_ID} from '../apps/web/lib/g678-nms-l01-p008.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P007Descriptor(),packet=readNmsL1P008Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P008_ID);
test('the exact eighth source placement extends the17-page predecessor to18 and preserves all other pages',()=>{
  const d=nmsL1P008Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,18);
  for(let i=0;i<47;i++)if(i!==7)assert.deepEqual(d.pages[i],base.pages[i]);
  assert.equal(d.pages[7].animationId,NMS_L1_P008_ID);assert.equal(d.pages[7].rendererAvailability.kind,'registered');assert.equal(d.pages[7].rendererAvailability.runtimeQuery.frameDomain,'sprite-81');
  const added=['direction','distance','opposite-integers'];assert.equal(d.glossary.length,28);assert.deepEqual(d.glossary.filter(e=>!added.includes(e.id)),base.glossary);
  for(const id of added){const e=d.glossary.find(e=>e.id===id);assert(e.definitions.en);assert(e.definitions.es);assert.equal(e.source.en.sha256,'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b');}
  assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('a wrong predecessor, glossary or registration cannot partially extend the lesson',()=>{
  const copy=structuredClone(base);
  for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P008Descriptor(base,packet,reg));
  for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=14;},b=>{b.pages[7].globalPageOrdinal=7;},b=>{b.glossary.find(e=>e.id==='integers').definitions.en+=' changed';}]){
    const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P008Descriptor(b,packet,registration));
  }
  assert.deepEqual(base,copy);
});
test('the Canvas endpoint reader returns only the source-bound registered artifact',()=>{
  const result=nmsL1P008Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);
  assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared placements and46 of47 NMSL1 pages while publication stays closed',()=>{
  const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);
  const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});

test('source-host stop is part of the current admission while the bare drawing stays source-bound',()=>{
 assert.equal(packet.hostedPlayback.kind,'once-source-host-terminal');assert.equal(packet.hostedPlayback.stopFrame,330);assert.equal(packet.entry.artifacts.timeline.path,'packages/demos/src/timelines/shared-nms002-l01-p008.ts');
 const altered=structuredClone(packet);altered.hostedPlayback.stopFrame=329;assert.throws(()=>extendNmsL1P008Descriptor(base,altered,registration),/source host terminal policy/);
});
