import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P037Descriptor} from '../apps/web/lib/g678-nms-l01-p037.server.ts';
import {readNmsL1P045Packet,extendNmsL1P045Descriptor,nmsL1P045Descriptor,nmsL1P045Canvas,NMS_L1_P045_ID} from '../apps/web/lib/g678-nms-l01-p045.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P037Descriptor(),packet=readNmsL1P045Packet(),registration=localOnlyAnimationModuleRegistration(NMS_L1_P045_ID);
test('active page45/TS8 extends45 to46 pages and preserves the other46 pages and all46 existing glossary terms',()=>{
 const d=nmsL1P045Descriptor();assert.equal(d.pages.length,47);assert.equal(d.course.courseShellCount,0);assert.equal(d.productBridge.registeredAnimationCount,46);
 for(let i=0;i<47;i++)if(i!==44)assert.deepEqual(d.pages[i],base.pages[i]);const p=d.pages[44];assert.equal(p.animationId,NMS_L1_P045_ID);assert.equal(p.globalPageOrdinal,45);assert.equal(p.sectionCode,'TS');assert.equal(p.sectionPageOrdinal,8);assert.equal(p.rendererAvailability.kind,'registered');assert.equal(p.rendererAvailability.runtimeQuery.frameDomain,'sprite-290');
 assert.deepEqual(d.glossary,base.glossary);assert.equal(d.glossary.length,46);assert.equal(packet.sourceGlossary.entries.length,2);assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('incorrect placement, predecessor, glossary or registration cannot partially extend the lesson',()=>{
 const copy=structuredClone(base);for(const reg of [undefined,{...registration,calibrationId:'wrong'},{...registration,moduleSha256:'0'.repeat(64)},{...registration,runtimeSha256:'0'.repeat(64)}])assert.throws(()=>extendNmsL1P045Descriptor(base,packet,reg));
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.productBridge.registeredAnimationCount=21;},b=>{b.pages[44].globalPageOrdinal=14;},b=>{b.pages[44].sectionPageOrdinal=9;},b=>{b.source.candidateFreezeManifestSha256='0'.repeat(64);}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1P045Descriptor(b,packet,registration));}assert.deepEqual(base,copy);
});
test('Canvas endpoint returns only the source-bound registered drawing',()=>{
 const result=nmsL1P045Canvas();assert.equal(result.sha256,packet.entry.artifacts.runtime.sha256);assert.equal(result.bytes.length,packet.entry.artifacts.runtime.bytes);assert.equal(createHash('sha256').update(result.bytes).digest('hex'),result.sha256);
});
test('All Lessons reports422 shared pages and46 of47 NMSL1 pages with publication still closed',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);const card=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(card.registeredPageCount,46);assert.equal(card.activePageCount,47);assert.equal(card.grade,null);assert.equal(card.mappingStatus,'pending');assert.equal(card.href,null);
});
test('five source holds,source answer order,and832 stop reject drift before descriptor construction',()=>{
 assert.equal(packet.audioPlan.questionFrame,813);assert.deepEqual(packet.practice.actions.mainStops,[388,525,651,773,813,832]);
 for(const mutate of [p=>{p.audioPlan.livePlaybackEndFrame=835;},p=>{p.practice.choices[0].value=100;},p=>{p.practice.choices[1].sourceInstanceName='AnsBtn2';},p=>{p.practice.strategies[1].waitFrame=61;},p=>{p.practice.holds[0].primarySourceHitBounds={x:1};},p=>{p.practice.teachingFlowGuard.sha256='0'.repeat(64);},p=>{p.sourceGlossary.entries[0].id='invented';},p=>{p.sourceGlossary.entries[0].definitions.en+=' changed';},p=>{p.sourceGlossary.entries[1]=p.sourceGlossary.entries[0];}]){const bad=structuredClone(packet);mutate(bad);assert.throws(()=>extendNmsL1P045Descriptor(base,bad,registration));}
});
