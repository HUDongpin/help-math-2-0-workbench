import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P034Descriptor} from '../apps/web/lib/g678-nms-l01-p034.server.ts';
import {readNmsL1P035Packet,extendNmsL1P035Descriptor,nmsL1P035Descriptor,nmsL1P035Canvas,NMS_L1_P035_ID} from '../apps/web/lib/g678-nms-l01-p035.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P034Descriptor(),packet=readNmsL1P035Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P035_ID);
test('active page35/TI9 extends42 to43 pages and preserves the other46 pages and all44 existing terms, adding source Decrease',()=>{
 const d=nmsL1P035Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,43);
 for(let i=0;i<47;i++)if(i!==34)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[34];assert.equal(p.animationId,NMS_L1_P035_ID);assert.equal(p.globalPageOrdinal,35);assert.equal(p.sectionCode,'TI');assert.equal(p.sectionPageOrdinal,9);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-246');
 assert.equal(d.glossary.length,45);assert.deepEqual(d.glossary.filter(e=>e.id!=='decrease'),base.glossary);const term=packet.sourceGlossary.entries.find(e=>e.id==='decrease');assert.deepEqual(d.glossary.find(e=>e.id==='decrease'),{id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,definitions:term.definitions,source:term.source});assert.equal(packet.sourceGlossary.entries.length,6);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P035Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[34].globalPageOrdinal=14;},b=>{b.pages[34].sectionPageOrdinal=10;},b=>{b.source.candidateFreezeManifestSha256='0'.repeat(64);}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P035Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P035Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('source245 wait and623 stop is required and cannot become automatic lesson completion',()=>{
 assert.equal(packet.audioPlan.questionFrame,245);assert.deepEqual(packet.practice.actions.mainStops,[245]);const altered=structuredClone(packet);altered.audioPlan.questionFrame=246;assert.throws(()=>extendNmsL1P035Descriptor(base,altered,registration),/source245 hold and bounded host623 stop/);
});

test('main glossary motion must preserve all three exact source ranges',()=>{const bad=structuredClone(packet);bad.practice.sourceHotspots[0].ranges[0].firstFrame=10;assert.throws(()=>extendNmsL1P035Descriptor(base,bad,registration),/three source glossary motion ranges/);});
