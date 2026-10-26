import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P017Descriptor} from '../apps/web/lib/g678-nms-l01-p017-v3.server.ts';
import {readNmsL1P018Packet,extendNmsL1P018Descriptor,nmsL1P018Descriptor,nmsL1P018Canvas,NMS_L1_P018_ID} from '../apps/web/lib/g678-nms-l01-p018.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P017Descriptor(),packet=readNmsL1P018Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P018_ID);
test('active page18/IN7 extends25 to26 pages and preserves the other46 pages and adds Column to31 glossary terms',()=>{
 const d=nmsL1P018Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,26);
 for(let i=0;i<47;i++)if(i!==17)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[17];assert.equal(p.animationId,NMS_L1_P018_ID);assert.equal(p.globalPageOrdinal,18);assert.equal(p.sectionCode,'IN');assert.equal(p.sectionPageOrdinal,7);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-78');
 assert.equal(d.glossary.length,32);assert.deepEqual(d.glossary.filter(e=>e.id!=='column'),base.glossary);assert.equal(packet.sourceGlossary.entries.length,4);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P018Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[17].globalPageOrdinal=15;},b=>{b.pages[17].sectionPageOrdinal=4;},b=>{b.glossary.find(e=>e.id==='absolute-value').definitions.en+=' changed';}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P018Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P018Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('a finite source host stop is required for admission',()=>{
 assert.equal(packet.audioPlan.mainFrameCount,492);assert.equal(packet.audioPlan.questionFrame,445);const altered=structuredClone(packet);altered.practice.actions.hostTerminal=491;assert.throws(()=>extendNmsL1P018Descriptor(base,altered,registration),/source and host stop policy/);
});
