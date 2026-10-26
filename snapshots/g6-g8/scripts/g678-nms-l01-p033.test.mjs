import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P032Descriptor} from '../apps/web/lib/g678-nms-l01-p032.server.ts';
import {readNmsL1P033Packet,extendNmsL1P033Descriptor,nmsL1P033Descriptor,nmsL1P033Canvas,NMS_L1_P033_ID} from '../apps/web/lib/g678-nms-l01-p033.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P032Descriptor(),packet=readNmsL1P033Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P033_ID);
test('active page33/TI7 extends40 to41 pages and preserves the other46 pages and all44 glossary terms',()=>{
 const d=nmsL1P033Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,41);
 for(let i=0;i<47;i++)if(i!==32)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[32];assert.equal(p.animationId,NMS_L1_P033_ID);assert.equal(p.globalPageOrdinal,33);assert.equal(p.sectionCode,'TI');assert.equal(p.sectionPageOrdinal,7);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-257');
 assert.equal(d.glossary.length,44);assert.deepEqual(d.glossary,base.glossary);assert.equal(packet.sourceGlossary.entries.length,2);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P033Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[32].globalPageOrdinal=14;},b=>{b.pages[32].sectionPageOrdinal=8;},b=>{b.source.candidateFreezeManifestSha256='0'.repeat(64);}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P033Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P033Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('source253 wait and511 stop is required and cannot become automatic lesson completion',()=>{
 assert.equal(packet.audioPlan.questionFrame,253);assert.deepEqual(packet.practice.actions.mainStops,[253]);const altered=structuredClone(packet);altered.audioPlan.questionFrame=254;assert.throws(()=>extendNmsL1P033Descriptor(base,altered,registration),/source253 hold and bounded host511 stop/);
});
