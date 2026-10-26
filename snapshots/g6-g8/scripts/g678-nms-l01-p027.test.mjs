import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P026Descriptor} from '../apps/web/lib/g678-nms-l01-p026.server.ts';
import {readNmsL1P027Packet,extendNmsL1P027Descriptor,nmsL1P027Descriptor,nmsL1P027Canvas,NMS_L1_P027_ID} from '../apps/web/lib/g678-nms-l01-p027.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P026Descriptor(),packet=readNmsL1P027Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P027_ID);
test('active page27/TI1 extends34 to35 pages and preserves the other46 pages and all44 glossary terms',()=>{
 const d=nmsL1P027Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,35);
 for(let i=0;i<47;i++)if(i!==26)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[26];assert.equal(p.animationId,NMS_L1_P027_ID);assert.equal(p.globalPageOrdinal,27);assert.equal(p.sectionCode,'TI');assert.equal(p.sectionPageOrdinal,1);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-344');
 assert.equal(d.glossary.length,44);assert.deepEqual(d.glossary,base.glossary);assert.equal(packet.sourceGlossary.entries.length,8);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P027Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[26].globalPageOrdinal=14;},b=>{b.pages[26].sectionPageOrdinal=5;},b=>{b.source.candidateFreezeManifestSha256='0'.repeat(64);}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P027Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P027Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('source330 wait and357 stop is required and cannot become automatic lesson completion',()=>{
 assert.equal(packet.audioPlan.questionFrame,330);assert.deepEqual(packet.practice.actions.mainStops,[330,357]);const altered=structuredClone(packet);altered.audioPlan.questionFrame=331;assert.throws(()=>extendNmsL1P027Descriptor(base,altered,registration),/source stops and final continuation/);
});
