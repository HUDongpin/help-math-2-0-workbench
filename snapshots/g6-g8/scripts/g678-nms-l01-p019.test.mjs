import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P018Descriptor} from '../apps/web/lib/g678-nms-l01-p018.server.ts';
import {readNmsL1P019Packet,extendNmsL1P019Descriptor,nmsL1P019Descriptor,nmsL1P019Canvas,NMS_L1_P019_ID} from '../apps/web/lib/g678-nms-l01-p019.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P018Descriptor(),packet=readNmsL1P019Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P019_ID);
test('active page19/IN8 extends26 to27 and preserves all46 other pages and32 glossary terms',()=>{
 const d=nmsL1P019Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,27);
 for(let i=0;i<47;i++)if(i!==18)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[18];assert.equal(p.animationId,NMS_L1_P019_ID);assert.equal(p.globalPageOrdinal,19);assert.equal(p.sectionCode,'IN');assert.equal(p.sectionPageOrdinal,8);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-71');
 assert.deepEqual(d.glossary,base.glossary);assert.equal(packet.sourceGlossary.entries.length,0);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary count or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P019Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=25;},b=>{b.pages[18].globalPageOrdinal=18;},b=>{b.pages[18].sectionPageOrdinal=7;},b=>{b.glossary.pop();}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P019Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound version2 drawing with canonical timeline registered',()=>{
 const result=nmsL1P019Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);assert.equal(packet.entry.artifacts.timeline.path,'packages/demos/src/timelines/shared-nms002-l01-p019.ts');
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('source553 remains the interactive stop and native audio is bounded before the preserved tail',()=>{
 assert.equal(packet.audioPlan.mainFrameCount,555);assert.equal(packet.audioPlan.questionFrame,553);assert.equal(packet.audioPlan.sourceBoundary.decodedSample,1004948);assert.equal(packet.audioPlan.sourceBoundary.unplayedPreservedTailSamples,3052);const altered=structuredClone(packet);altered.practice.actions.mainStops=[555];assert.throws(()=>extendNmsL1P019Descriptor(base,altered,registration),/source stop policy/);
});
