import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P035Descriptor} from '../apps/web/lib/g678-nms-l01-p035.server.ts';
import {readNmsL1P036Packet,extendNmsL1P036Descriptor,nmsL1P036Descriptor,nmsL1P036Canvas,NMS_L1_P036_ID} from '../apps/web/lib/g678-nms-l01-p036.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P035Descriptor(),packet=readNmsL1P036Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P036_ID);
test('active page36/TI10 extends43 to44 pages and preserves the other46 pages and all45 existing terms and adds Sign',()=>{
 const d=nmsL1P036Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,44);
 for(let i=0;i<47;i++)if(i!==35)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[35];assert.equal(p.animationId,NMS_L1_P036_ID);assert.equal(p.globalPageOrdinal,36);assert.equal(p.sectionCode,'TI');assert.equal(p.sectionPageOrdinal,10);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-130');
 assert.equal(d.glossary.length,46);assert.deepEqual(d.glossary.filter(e=>e.id!=='sign'),base.glossary);const source=packet.sourceGlossary.entries.find(e=>e.id==='sign');assert.deepEqual(d.glossary.find(e=>e.id==='sign'),{id:source.id,sourceKeyAttribute:source.sourceKeyAttribute,labels:source.labels,definitions:source.definitions,source:source.source});assert.equal(packet.sourceGlossary.entries.length,9);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P036Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[35].globalPageOrdinal=14;},b=>{b.pages[35].sectionPageOrdinal=11;},b=>{b.source.candidateFreezeManifestSha256='0'.repeat(64);}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P036Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P036Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('source619 wait and678 stop is required and cannot become automatic lesson completion',()=>{
 assert.equal(packet.audioPlan.questionFrame,619);assert.deepEqual(packet.practice.actions.mainStops,[619,678]);const altered=structuredClone(packet);altered.audioPlan.questionFrame=620;assert.throws(()=>extendNmsL1P036Descriptor(base,altered,registration),/source619 hold and678 authored stop/);
});

test('both5 tokens and every source glossary occurrence remain exact',()=>{for(const mutate of [p=>{p.practice.choices.find(c=>c.sourceIndex===5).permittedTargets=[5];},p=>{p.practice.sourceHotspots[0].ranges[0].firstFrame=9;},p=>{p.audioPlan.livePlaybackEndFrame=679;}]){const bad=structuredClone(packet);mutate(bad);assert.throws(()=>extendNmsL1P036Descriptor(base,bad,registration));}});
