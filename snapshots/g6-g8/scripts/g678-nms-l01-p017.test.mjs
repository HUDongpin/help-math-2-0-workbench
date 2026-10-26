import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P016Descriptor} from '../apps/web/lib/g678-nms-l01-p016.server.ts';
import {readNmsL1P017Packet,extendNmsL1P017Descriptor,nmsL1P017Descriptor,nmsL1P017Canvas,NMS_L1_P017_ID} from '../apps/web/lib/g678-nms-l01-p017-v3.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P016Descriptor(),packet=readNmsL1P017Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P017_ID);
test('active page17/IN6 extends24 to25 pages and preserves the other46 pages and all31 glossary terms',()=>{
 const d=nmsL1P017Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,25);
 for(let i=0;i<47;i++)if(i!==16)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[16];assert.equal(p.animationId,NMS_L1_P017_ID);assert.equal(p.globalPageOrdinal,17);assert.equal(p.sectionCode,'IN');assert.equal(p.sectionPageOrdinal,6);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-62');
 assert.equal(d.glossary.length,31);assert.deepEqual(d.glossary,base.glossary);assert.equal(packet.sourceGlossary.entries.length,3);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P017Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[16].globalPageOrdinal=14;},b=>{b.pages[16].sectionPageOrdinal=5;},b=>{b.glossary.find(e=>e.id==='absolute-value').definitions.en+=' changed';}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P017Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P017Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('a finite source host stop is required for admission',()=>{
 assert.equal(packet.hostedPlayback.kind,'once-source-host-terminal');assert.equal(packet.hostedPlayback.stopFrame,646);const altered=structuredClone(packet);altered.hostedPlayback.stopFrame=645;assert.throws(()=>extendNmsL1P017Descriptor(base,altered,registration),/source host terminal policy/);
});
