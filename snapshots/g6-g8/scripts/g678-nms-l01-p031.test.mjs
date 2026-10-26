import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P030Descriptor} from '../apps/web/lib/g678-nms-l01-p030.server.ts';
import {readNmsL1P031Packet,extendNmsL1P031Descriptor,nmsL1P031Descriptor,nmsL1P031Canvas,NMS_L1_P031_ID} from '../apps/web/lib/g678-nms-l01-p031.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P030Descriptor(),packet=readNmsL1P031Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P031_ID);
test('active page31/TI5 extends38 to39 pages and preserves the other46 pages and all44 glossary terms',()=>{
 const d=nmsL1P031Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,39);
 for(let i=0;i<47;i++)if(i!==30)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[30];assert.equal(p.animationId,NMS_L1_P031_ID);assert.equal(p.globalPageOrdinal,31);assert.equal(p.sectionCode,'TI');assert.equal(p.sectionPageOrdinal,5);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-374');
 assert.equal(d.glossary.length,44);assert.deepEqual(d.glossary,base.glossary);assert.equal(packet.sourceGlossary.entries.length,2);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P031Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[30].globalPageOrdinal=14;},b=>{b.pages[30].sectionPageOrdinal=6;},b=>{b.source.candidateFreezeManifestSha256='0'.repeat(64);}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P031Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P031Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('source542 wait and604 stop is required and cannot become automatic lesson completion',()=>{
 assert.equal(packet.audioPlan.questionFrame,542);assert.deepEqual(packet.practice.actions.mainStops,[542,543,544,545,546,547,548,604,605]);const altered=structuredClone(packet);altered.audioPlan.questionFrame=543;assert.throws(()=>extendNmsL1P031Descriptor(base,altered,registration),/four question holds and explicit549\.\.604 repair/);
});
