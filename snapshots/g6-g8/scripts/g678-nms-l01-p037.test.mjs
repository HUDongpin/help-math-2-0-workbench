import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P036Descriptor} from '../apps/web/lib/g678-nms-l01-p036.server.ts';
import {readNmsL1P037Packet,extendNmsL1P037Descriptor,nmsL1P037Descriptor,nmsL1P037Canvas,NMS_L1_P037_ID} from '../apps/web/lib/g678-nms-l01-p037.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P036Descriptor(),packet=readNmsL1P037Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P037_ID);
test('active page37/GS1 extends44 to45 pages and preserves the other46 pages and all46 existing glossary terms',()=>{
 const d=nmsL1P037Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,45);
 for(let i=0;i<47;i++)if(i!==36)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[36];assert.equal(p.animationId,NMS_L1_P037_ID);assert.equal(p.globalPageOrdinal,37);assert.equal(p.sectionCode,'GS');assert.equal(p.sectionPageOrdinal,1);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-636');
 assert.deepEqual(d.glossary,base.glossary);assert.equal(d.glossary.length,46);assert.equal(packet.sourceGlossary.entries.length,0);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P037Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[36].globalPageOrdinal=14;},b=>{b.pages[36].sectionPageOrdinal=2;},b=>{b.source.candidateFreezeManifestSha256='0'.repeat(64);}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P037Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P037Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('instruction595,game596,and child111 are independent of main601',()=>{
 assert.equal(packet.audioPlan.questionFrame,596);assert.deepEqual(packet.practice.actions.mainStops,[595,596,601]);assert.equal(packet.audioPlan.endChildFrameCount,111);
 for(const mutate of [p=>{p.audioPlan.questionFrame=595;},p=>{p.audioPlan.endChildFrameCount=4;},p=>{p.practice.rows[12].delta=4;},p=>{p.practice.clickSites.push({...p.practice.clickSites[100],clickIndex:102,lineNumber:81});},p=>{p.practice.orderedPlayGuard.sha256='0'.repeat(64);},p=>{p.sourceGlossary.entries=[{id:'invented'}];}]){const bad=structuredClone(packet);mutate(bad);assert.throws(()=>extendNmsL1P037Descriptor(base,bad,registration));}
});
