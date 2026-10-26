import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P008Descriptor} from '../apps/web/lib/g678-nms-l01-p008.server.ts';
import {readNmsL1P009Packet,extendNmsL1P009Descriptor,nmsL1P009Descriptor,nmsL1P009Canvas,NMS_L1_P009_ID} from '../apps/web/lib/g678-nms-l01-p009.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P008Descriptor(),packet=readNmsL1P009Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P009_ID);
test('the exact ninth source placement extends18 pages to19 and preserves the other46 placements',()=>{
 const d=nmsL1P009Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,19);
 for(let i=0;i<47;i++)if(i!==8)assert.deepEqual(d.pages[i],base.pages[i]);
 assert.equal(d.pages[8].animationId,NMS_L1_P009_ID);assert.equal(d.pages[8].rendererAvailability.kind,'registered');assert.equal(d.pages[8].rendererAvailability.runtimeQuery.frameDomain,'sprite-197');
 assert.equal(d.glossary.length,29);assert.deepEqual(d.glossary.filter(e=>e.id!=='value'),base.glossary);
 const value=d.glossary.find(e=>e.id==='value');assert(value.definitions.en);assert(value.definitions.es);assert.equal(value.source.en.sha256,'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b');
 assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('mismatched registration, source placement and changed glossary cannot partly extend the lesson',()=>{
 const copy=structuredClone(base);
 for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P009Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=17;},b=>{b.pages[8].globalPageOrdinal=8;},b=>{b.glossary.find(e=>e.id==='opposite-integers').definitions.en+=' changed';}]){
  const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P009Descriptor(b,packet,registration));
 }
 assert.deepEqual(base,copy);
});
test('source host branch set, ADPCM branch and finite main stops remain part of the bound packet',()=>{
 assert.deepEqual(packet.audioPlan.branches.map(b=>[b.kind,b.index,b.sourceCharacterId]),[['wrong',1,86],['wrong',2,62],['wrong',3,74],['right',1,128],['right',2,145],['right',3,157],['right',4,171]]);
 assert.equal(packet.audioPlan.questionFrame,39);assert.equal(packet.audioPlan.outroFirstFrame,40);assert.equal(packet.practice.actions.hostTerminalStop,79);
 const adpcm=packet.audioPlan.clips.find(c=>c.frameDomain==='sprite-157');assert.equal(adpcm.decoder.decodedSamples,23870);assert.equal(adpcm.latencySamples,0);
 assert(adpcm.normalization.includes('source-ADPCM'));assert.equal(packet.audioPlan.clips.length,8);
 assert.equal(packet.scaleOutAuthorized,false);assert(Object.values(packet.acceptanceEffects).every(v=>v===false));
});
test('Canvas endpoint returns the exact registered runtime bytes',()=>{
 const result=nmsL1P009Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);
 assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared placements and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);
 const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
