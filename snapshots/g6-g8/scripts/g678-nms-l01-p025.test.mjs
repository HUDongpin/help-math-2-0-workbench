import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P024Descriptor} from '../apps/web/lib/g678-nms-l01-p024.server.ts';
import {readNmsL1P025Packet,extendNmsL1P025Descriptor,nmsL1P025Descriptor,nmsL1P025Canvas,NMS_L1_P025_ID} from '../apps/web/lib/g678-nms-l01-p025.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P024Descriptor(),packet=readNmsL1P025Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P025_ID);
test('active page25/IN14 extends32 to33 pages and preserves the other46 pages and all41 existing glossary terms',()=>{
 const d=nmsL1P025Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,33);
 for(let i=0;i<47;i++)if(i!==24)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[24];assert.equal(p.animationId,NMS_L1_P025_ID);assert.equal(p.globalPageOrdinal,25);assert.equal(p.sectionCode,'IN');assert.equal(p.sectionPageOrdinal,14);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-38');
 assert.equal(d.glossary.length,44);assert.deepEqual(d.glossary.filter(e=>!['division','equivalent','group'].includes(e.id)),base.glossary);assert.equal(packet.sourceGlossary.entries.length,5);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P025Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[24].globalPageOrdinal=14;},b=>{b.pages[24].sectionPageOrdinal=5;},b=>{b.glossary.find(e=>e.id==='multiplication').definitions.en+=' changed';}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P025Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P025Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('a finite source host stop is required for admission',()=>{
 assert.equal(packet.hostedPlayback.kind,'once-source-host-terminal');assert.equal(packet.hostedPlayback.stopFrame,337);const altered=structuredClone(packet);altered.hostedPlayback.stopFrame=336;assert.throws(()=>extendNmsL1P025Descriptor(base,altered,registration),/source host terminal policy/);
});
